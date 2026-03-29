// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICarbonToken is IERC1155 {
    function getProjectId(uint256 tokenId) external view returns (string memory);
    function getVintageYear(uint256 tokenId) external view returns (uint16);
    function tokenExists(uint256 tokenId) external view returns (bool);
}

contract CarbonMarketplace is Ownable, ERC1155Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FIXED_FEE_BPS = 1_000; // 10%
    uint256 public constant MAX_PURCHASE_LINES = 20;

    uint256 public nextListingId = 1;

    struct Listing {
        uint256 listingId;
        address seller;
        uint256 tokenId;
        string projectId;
        uint16 vintageYear;
        uint256 pricePerUnit;
        uint256 availableAmount;
        bool active;
    }

    ICarbonToken public immutable carbonToken;
    IERC20 public immutable usdt;
    address public feeRecipient;

    mapping(uint256 => Listing) public listings;

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 pricePerUnit,
        uint256 availableAmount
    );

    event ListingUpdated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 newPricePerUnit,
        uint256 newAvailableAmount
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );

    event TokenPurchasedByProject(
        address indexed buyer,
        bytes32 indexed projectHash,
        uint256 totalLines,
        uint256 totalCost,
        uint256 totalFee
    );

    event FeeRecipientUpdated(address indexed newFeeRecipient);

    constructor(
        address _carbonToken,
        address _usdt,
        address _owner,
        address _feeRecipient
    ) Ownable(_owner) {
        require(_carbonToken != address(0), "Invalid carbon token");
        require(_usdt != address(0), "Invalid usdt");
        require(_owner != address(0), "Invalid owner");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        carbonToken = ICarbonToken(_carbonToken);
        usdt = IERC20(_usdt);
        feeRecipient = _feeRecipient;
    }

    // ---------------- SELLER ----------------

    function createListing(
        uint256 tokenId,
        uint256 price,
        uint256 sellAmount
    ) external nonReentrant {
        require(sellAmount > 0, "Invalid sell amount");

        carbonToken.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            sellAmount,
            ""
        );

        _createListing(tokenId, price, sellAmount);
    }

    function createListingsBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata prices,
        uint256[] calldata sellAmounts
    ) external nonReentrant {
        require(
            tokenIds.length == prices.length && prices.length == sellAmounts.length,
            "Mismatch input lengths"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(sellAmounts[i] > 0, "Invalid sell amount");

            carbonToken.safeTransferFrom(
                msg.sender,
                address(this),
                tokenIds[i],
                sellAmounts[i],
                ""
            );

            _createListing(tokenIds[i], prices[i], sellAmounts[i]);
        }
    }

    function _createListing(
        uint256 tokenId,
        uint256 price,
        uint256 amount
    ) internal {
        listings[nextListingId] = Listing({
            listingId: nextListingId,
            seller: msg.sender,
            tokenId: tokenId,
            projectId: carbonToken.getProjectId(tokenId),
            vintageYear: carbonToken.getVintageYear(tokenId),
            pricePerUnit: price,
            availableAmount: amount,
            active: true
        });

        emit ListingCreated(nextListingId, msg.sender, tokenId, price, amount);
        nextListingId++;
    }

    function updateListing(
        uint256 listingId,
        uint256 newPrice,
        uint256 newAmount
    ) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Listing inactive");
        require(newAmount > 0, "Use cancelListing");
        
        if (newAmount > listing.availableAmount) {
            uint256 extra = newAmount - listing.availableAmount;
            carbonToken.safeTransferFrom(
                msg.sender,
                address(this),
                listing.tokenId,
                extra,
                ""
            );
        } else if (newAmount < listing.availableAmount) {
            uint256 refund = listing.availableAmount - newAmount;
            carbonToken.safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId,
                refund,
                ""
            );
        }

        listing.pricePerUnit = newPrice;
        listing.availableAmount = newAmount;

        emit ListingUpdated(listingId, msg.sender, newPrice, newAmount);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Listing inactive");

        uint256 refundAmount = listing.availableAmount;

        listing.availableAmount = 0;
        listing.active = false;

        carbonToken.safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            refundAmount,
            ""
        );

        emit ListingCancelled(listingId, msg.sender);
    }

    // ---------------- BUYER ----------------

    function buyByProject(
        string calldata projectId,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external nonReentrant {
        require(ids.length == amounts.length, "Mismatch input lengths");
        require(ids.length > 0, "Empty purchase");
        require(ids.length <= MAX_PURCHASE_LINES, "Too many purchase lines");
        require(
            usdt.allowance(msg.sender, address(this)) > 0,
            "Approve USDT first"
        );

        // Prevent duplicate listingIds
        for (uint256 i = 0; i < ids.length; i++) {
            for (uint256 j = i + 1; j < ids.length; j++) {
                require(ids[i] != ids[j], "Duplicate listingId");
            }
        }

        bytes32 pHash = keccak256(bytes(projectId));
        uint256 totalFee = 0;
        uint256 totalCost = 0;

        uint256[] memory tokenIds = new uint256[](ids.length);
        uint256[] memory sellerReceives = new uint256[](ids.length);

        // 1. Checks + calculations
        for (uint256 i = 0; i < ids.length; i++) {
            Listing storage listing = listings[ids[i]];
            uint256 amount = amounts[i];

            require(amount > 0, "Invalid amount");
            require(listing.active, "Inactive listing");
            require(listing.availableAmount >= amount, "Insufficient listed amount");
            require(
                keccak256(bytes(listing.projectId)) == pHash,
                "Wrong project"
            );

            uint256 gross = listing.pricePerUnit * amount;
            uint256 fee = (gross * FIXED_FEE_BPS) / 10_000;
            uint256 sellerReceive = gross - fee;

            tokenIds[i] = listing.tokenId;
            sellerReceives[i] = sellerReceive;

            totalCost += gross;
            totalFee += fee;
        }

        require(
            usdt.allowance(msg.sender, address(this)) >= totalCost,
            "Insufficient USDT allowance"
        );

        // 2. Effects
        for (uint256 i = 0; i < ids.length; i++) {
            Listing storage listing = listings[ids[i]];
            listing.availableAmount -= amounts[i];

            if (listing.availableAmount == 0) {
                listing.active = false;
            }
        }

        // 3. Interactions
        for (uint256 i = 0; i < ids.length; i++) {
            Listing storage listing = listings[ids[i]];
            usdt.safeTransferFrom(msg.sender, listing.seller, sellerReceives[i]);
        }

        if (totalFee > 0) {
            usdt.safeTransferFrom(msg.sender, feeRecipient, totalFee);
        }

        for (uint256 i = 0; i < ids.length; i++) {
            carbonToken.safeTransferFrom(
                address(this),
                msg.sender,
                tokenIds[i],
                amounts[i],
                ""
            );
        }

        emit TokenPurchasedByProject(
            msg.sender,
            pHash,
            ids.length,
            totalCost,
            totalFee
        );
    }

    // ---------------- ADMIN ----------------

    function updateFeeRecipient(address _new) external onlyOwner {
        require(_new != address(0), "Invalid fee recipient");
        feeRecipient = _new;
        emit FeeRecipientUpdated(_new);
    }

    // ---------------- VIEW ----------------

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
}

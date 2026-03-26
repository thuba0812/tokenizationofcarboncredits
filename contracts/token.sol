// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract CarbonToken is ERC1155, Ownable {
    struct TokenInfo {
        string projectId;
        string serialId;
        string cid;
        uint16 vintageYear;
        uint256 totalMinted;
        uint256 currentSupply;
        uint256 totalBurned;
        bool exists;
    }

    struct MintItem {
        address to;
        uint256 tokenId;
        string projectId;
        string serialId;
        uint16 vintageYear;
        uint256 amount;
        string cid;
    }

    mapping(uint256 => TokenInfo) private _tokenInfos;

    mapping(bytes32 => bool) private _usedProjectYearKeys;
    mapping(bytes32 => bool) private _usedCidHashes;

    mapping(address => uint256) public totalEnterpriseBurned;

    event CarbonMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string projectId,
        string serialId,
        uint16 vintageYear,
        uint256 amount,
        string cid
    );

    event CarbonMintSkipped(
        address indexed recipient,
        uint256 indexed tokenId,
        string projectId,
        string serialId,
        uint16 vintageYear,
        string reason
    );

    event CarbonMintBatchSummary(
        uint256 requestedCount,
        uint256 mintedCount,
        uint256 skippedCount
    );

    event CarbonBurnedBatch(
        address indexed enterprise,
        uint256[] tokenIds,
        uint256[] amounts,
        uint256 totalBurnedNow,
        uint256 quotaRemaining
    );

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    /**
     * Flow:
     * - Backend doc CSDL
     * - Backend gom metadata
     * - Backend upload IPFS
     * - Backend nhan CID
     * - Backend tao tokenId
     * - Backend goi ham mint nay
     */
    function mintProjectYearBatchSoft(
        MintItem[] calldata items
    ) external onlyOwner {
        uint256 length = items.length;
        require(length > 0, "Empty batch");

        uint256 mintedCount = 0;
        uint256 skippedCount = 0;

        for (uint256 i = 0; i < length; i++) {
            MintItem calldata item = items[i];

            if (item.to == address(0)) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Invalid recipient"
                );
                continue;
            }

            if (bytes(item.projectId).length == 0) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Empty projectId"
                );
                continue;
            }

            if (bytes(item.serialId).length == 0) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Empty serialId"
                );
                continue;
            }

            if (item.vintageYear == 0) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Invalid vintage year"
                );
                continue;
            }

            if (item.amount == 0) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Amount must be > 0"
                );
                continue;
            }

            if (_tokenInfos[item.tokenId].exists) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Token ID already minted"
                );
                continue;
            }

            if (bytes(item.cid).length == 0) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Empty CID"
                );
                continue;
            }

            bytes32 projectYearKey = keccak256(
                abi.encodePacked(item.projectId, "|", item.vintageYear)
            );
            if (_usedProjectYearKeys[projectYearKey]) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "Project year already tokenized"
                );
                continue;
            }

            bytes32 cidHash = keccak256(bytes(item.cid));
            if (_usedCidHashes[cidHash]) {
                skippedCount++;
                emit CarbonMintSkipped(
                    item.to,
                    item.tokenId,
                    item.projectId,
                    item.serialId,
                    item.vintageYear,
                    "CID already used"
                );
                continue;
            }

            _tokenInfos[item.tokenId] = TokenInfo({
                projectId: item.projectId,
                serialId: item.serialId,
                cid: item.cid,
                vintageYear: item.vintageYear,
                totalMinted: item.amount,
                currentSupply: item.amount,
                totalBurned: 0,
                exists: true
            });

            _usedProjectYearKeys[projectYearKey] = true;
            _usedCidHashes[cidHash] = true;

            _mint(item.to, item.tokenId, item.amount, "");
            mintedCount++;

            emit CarbonMinted(
                item.to,
                item.tokenId,
                item.projectId,
                item.serialId,
                item.vintageYear,
                item.amount,
                item.cid
            );
        }

        emit CarbonMintBatchSummary(length, mintedCount, skippedCount);
    }

    /**
     * allowedQuota duoc backend lay tu database va truyen vao.
     */
    function burnCarbonBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        uint256 allowedQuota
    ) external {
        uint256 length = tokenIds.length;
        require(length == amounts.length, "Mismatch input lengths");
        require(length > 0, "Empty batch");

        uint256 totalToBurn = 0;

        for (uint256 i = 0; i < length; i++) {
            require(_tokenInfos[tokenIds[i]].exists, "Token does not exist");
            require(amounts[i] > 0, "Amount must be > 0");
            require(balanceOf(msg.sender, tokenIds[i]) >= amounts[i], "Insufficient balance");
            totalToBurn += amounts[i];
        }

        require(
            totalEnterpriseBurned[msg.sender] + totalToBurn <= allowedQuota,
            "Exceeds enterprise quota"
        );

        _burnBatch(msg.sender, tokenIds, amounts);
        totalEnterpriseBurned[msg.sender] += totalToBurn;

        for (uint256 i = 0; i < length; i++) {
            _tokenInfos[tokenIds[i]].currentSupply -= amounts[i];
            _tokenInfos[tokenIds[i]].totalBurned += amounts[i];
        }

        emit CarbonBurnedBatch(
            msg.sender,
            tokenIds,
            amounts,
            totalToBurn,
            allowedQuota - totalEnterpriseBurned[msg.sender]
        );
    }

    function tokenExists(uint256 tokenId) external view returns (bool) {
        return _tokenInfos[tokenId].exists;
    }

    function getTokenInfo(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory projectId,
            string memory serialId,
            uint16 vintageYear,
            string memory cid,
            uint256 totalMinted,
            uint256 currentSupply,
            uint256 totalBurned,
            bool exists
        )
    {
        TokenInfo memory info = _tokenInfos[tokenId];
        return (
            info.projectId,
            info.serialId,
            info.vintageYear,
            info.cid,
            info.totalMinted,
            info.currentSupply,
            info.totalBurned,
            info.exists
        );
    }

    function getProjectId(uint256 tokenId) external view returns (string memory) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].projectId;
    }

    function getSerialId(uint256 tokenId) external view returns (string memory) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].serialId;
    }

    function getVintageYear(uint256 tokenId) external view returns (uint16) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].vintageYear;
    }

    function getTotalMinted(uint256 tokenId) external view returns (uint256) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].totalMinted;
    }

    function getCurrentSupply(uint256 tokenId) external view returns (uint256) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].currentSupply;
    }

    function getTotalBurned(uint256 tokenId) external view returns (uint256) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return _tokenInfos[tokenId].totalBurned;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(_tokenInfos[tokenId].exists, "Token does not exist");
        return string(abi.encodePacked("ipfs://", _tokenInfos[tokenId].cid));
    }
}

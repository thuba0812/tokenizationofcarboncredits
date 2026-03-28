const { Contract, Interface, ethers } = require('ethers');
const abi = ["function buyByProject(string projectId, uint256[] ids, uint256[] amounts)"];

async function main() {
  const provider = new ethers.JsonRpcProvider();
  const contract = new Contract('0x0000000000000000000000000000000000000000', abi, provider);

  try {
    // Ethers v6 contract methods accept Promises. Does it check .then on undefined array elements?
    await contract.buyByProject("PROJ", [undefined], [2]);
  } catch(err) {
    console.log("ERR:", err.message);
  }
}
main();

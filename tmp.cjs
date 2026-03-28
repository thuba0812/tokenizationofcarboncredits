const { Contract, Interface, ethers } = require('ethers');
const abi = [
  "function buyByProject(string projectId, uint256[] ids, uint256[] amounts)"
];
const iface = new Interface(abi);

try {
  iface.encodeFunctionData("buyByProject", ["PROJ1", [1], [undefined]]);
  console.log("Encoded successfully (unexpected)");
} catch (err) {
  console.log("Encode error:", err.message);
}

const provider = new ethers.JsonRpcProvider();
const contract = new Contract('0x0000000000000000000000000000000000000000', abi, provider);
try {
  contract.buyByProject("PROJ", [1], [undefined]).catch(e => console.log("Call error:", e.message));
} catch(err) {
  console.log("Call catch:", err.message);
}

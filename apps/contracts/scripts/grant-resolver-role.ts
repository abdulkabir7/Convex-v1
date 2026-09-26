import hre from "hardhat";

const MANAGER_ADDRESS = process.env.MANAGER_CONTRACT_ADDRESS || "0xd59A8fdf194F41fFb46888d63909F298DF600F30";
const RESOLVER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RESOLVER_ROLE"));

async function main() {
  const walletAddress = process.env.RESOLVER_ADDRESS;
  if (!walletAddress) {
    console.error(
      "Usage:\n" +
      "  PowerShell: $env:RESOLVER_ADDRESS=\"0x...\"; npx hardhat run scripts/grant-resolver-role.ts --network arcMainnet\n" +
      "  Bash/macOS: RESOLVER_ADDRESS=0x... npx hardhat run scripts/grant-resolver-role.ts --network arcMainnet"
    );
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);

  const managerAbi = [
    "function grantRole(bytes32 role, address account) external",
    "function hasRole(bytes32 role, address account) external view returns (bool)",
  ];

  const manager = await hre.ethers.getContractAt(managerAbi, MANAGER_ADDRESS, signer);

  const hasRole = await manager.hasRole(RESOLVER_ROLE, walletAddress);
  if (hasRole) {
    console.log(`✅ ${walletAddress} already has RESOLVER_ROLE`);
    return;
  }

  console.log(`Granting RESOLVER_ROLE to ${walletAddress}...`);
  const tx = await manager.grantRole(RESOLVER_ROLE, walletAddress);
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ RESOLVER_ROLE granted to ${walletAddress}`);
}

main().catch(console.error);


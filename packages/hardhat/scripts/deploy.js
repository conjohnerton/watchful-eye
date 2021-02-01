/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, network } = require("hardhat");
const { Contract } = require("ethers");
const { utils } = require("ethers");
const R = require("ramda");
const {
  abi: erc20abi,
} = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const { parseUnits } = require("ethers/lib/utils");

const main = async () => {
  console.log("\n\n 📡 Deploying...\n");

  // impersonate whale account
  await network.provider.request(
    {
      method: "hardhat_impersonateAccount",
      params: ["0x708396f17127c42383E3b9014072679b2F60B82f"],
    } // Whale account
  );

  const FakeEthToDaiSwapper = await deploy("FakeLinkToDaiSwapper", []);

  const FakeDebtToCollateralSwapper = await deploy(
    "FakeDebtToCollateralSwapper",
    []
  );

  // 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5 mainnnet
  // 0x88757f2f99175387ab4c6a4b3067c77a695b0349 kovan
  const WatchfulEyeContract = await deploy("TheWatchfulEye", [
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", // Aave mainnet lending pool address provider
    // "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E", // 1Inch mainnet address
    "0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e", // 1Inch mainnet beta address (working!!!! I think)
    // "0x71CD6666064C3A1354a3B4dca5fA1E2D3ee7D303", //mooniswap
    FakeEthToDaiSwapper.address,
    FakeDebtToCollateralSwapper.address,
  ]);

  // Fund the contracts for the mock operations.
  const signer = ethers.provider.getSigner(
    "0x708396f17127c42383E3b9014072679b2F60B82f"
  );
  const link = new Contract(
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    erc20abi,
    signer
  );
  await link.transfer(FakeDebtToCollateralSwapper.address, parseUnits("1000"));

  const dai = new Contract(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    erc20abi,
    signer
  );
  await dai.transfer(FakeEthToDaiSwapper.address, parseUnits("1000"));
  // await dai.transfer(WatchfulEyeContract.address, parseUnits("1000"));

  // Send some to me so I can see that the transfer works :)
  // await dai.transfer("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", parseUnits("1000"));

  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: ["0x708396f17127c42383E3b9014072679b2F60B82f"],
  });

  // const exampleToken = await deploy("ExampleToken")
  // const examplePriceOracle = await deploy("ExamplePriceOracle")
  // const smartContractWallet = await deploy("SmartContractWallet",[exampleToken.address,examplePriceOracle.address])

  /*

  //If you want to send some ETH to a contract on deploy (make your constructor payable!)

  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  console.log(
    " 💾  Artifacts (address, abi, and args) saved to: ",
    chalk.blue("packages/hardhat/artifacts/"),
    "\n\n"
  );
};

const deploy = async (contractName, _args = [], overrides = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName);
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address)
  );

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf(".sol") >= 0 &&
  fileName.indexOf(".swp") < 0 &&
  fileName.indexOf(".swap") < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

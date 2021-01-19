const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  compilers: {
    solc: {
      version: "^0.6.12", // A version or constraint - Ex. "^0.5.0"
      // Can also be set to "native" to use a native solc
      parser: "solcjs", // Leverages solc-js purely for speedy parsing
      settings: {
        optimizer: {
          enabled: true,
          runs: 200, // Optimize for how many times you intend to run the code
        },
      },
    },
  },
  networks: {
    develop: {
      port: 7545,
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.KOVAN_ENDPOINT
        );
      },
      network_id: 42,
    },
  },
};

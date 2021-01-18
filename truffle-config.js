const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
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

pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import {SafeMath} from './aave/dependencies/openzeppelin/contracts/SafeMath.sol';
import { Ownable } from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeSwapper is Ownable {
    using SafeMath for uint256;

    event SwapDone(address _reserve, uint256 amount , uint256 value);

    receive() external payable {}

    function swapDaiForEthCollateral(address fromAddress, uint256 amount) external {
        // require(msg.value > 0.01 ether, "Woah buddy... Try sending a bit less ETH. This is a fake swap anyways, you don't really need to drain our pockets on the test-net...");
    }
}
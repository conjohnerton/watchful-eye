pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeMath } from './aave/dependencies/openzeppelin/contracts/SafeMath.sol';
import { Ownable } from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeLinkToDaiSwapper is Ownable {
    using SafeMath for uint256;

    event SwapDone(address _reserve, uint256 amount , uint256 value);

    receive() external payable {}

    function doSwap() external {

        // Check price of eth and swap number of dai based on it.
    }
}
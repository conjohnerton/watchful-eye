pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import {
    SafeMath
} from "./aave/dependencies/openzeppelin/contracts/SafeMath.sol";
import {Ownable} from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeDebtToCollateralSwapper is Ownable {
    using SafeMath for uint256;

    event SwapDone(address _reserve, uint256 amount, uint256 sent);

    IERC20 linkToken = IERC20(0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789);
    IERC20 daiToken = IERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);

    constructor() Ownable() public {}

    receive() external payable {}

    function repay(address onBehalfOf, uint256 amount) external {
        (bool successOne) = daiToken.transferFrom(msg.sender, address(this), amount);
        require(successOne, "Could not transfer from The Watchful Eye to FakeDebtToCollateralSwapper.");
        (bool successTwo) = linkToken.transfer(onBehalfOf, linkToken.balanceOf(address(this)));
        require(successTwo, "Could not transfer from FakeDebtToCollateralSwapper to The Watchful Eye.");
        emit SwapDone(msg.sender, amount, amount);
    }
}

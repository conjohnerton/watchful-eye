pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import {
    SafeMath
} from "./aave/dependencies/openzeppelin/contracts/SafeMath.sol";
import {Ownable} from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeDebtToCollateralSwapper is Ownable {
    using SafeMath for uint256;

    event SwapDone(address _reserve, uint256 amount, uint256 value);

    IERC20 linkToken = IERC20(0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789);

    constructor() Ownable() public {

    }
    
    receive() external payable {}

    function repay(address onBehalfOf, uint256 amount) external {
        // require(msg.value > 0.01 ether, "Woah buddy... Try sending a bit less ETH. This is a fake swap anyways, you don't really need to drain our pockets on the test-net...");
        bool success = linkToken.transferFrom(msg.sender, address(this), amount);
        linkToken.transfer(onBehalfOf, amount);
    }
}

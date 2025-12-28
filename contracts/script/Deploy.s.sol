// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DroneJobEscrow} from "../src/DroneJobEscrow.sol";

contract DeployScript is Script {
    function run() external returns (DroneJobEscrow) {
        // For local Anvil, use the default first account (no private key needed)
        // Anvil's first account private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        // But we can just use msg.sender which will be the first account when broadcasting
        
        address deployer = msg.sender;
        address arbitrator = deployer; // Use deployer as arbitrator for local development
        
        vm.startBroadcast();
        
        DroneJobEscrow escrow = new DroneJobEscrow(arbitrator);
        
        vm.stopBroadcast();
        
        console.log("DroneJobEscrow deployed at:", address(escrow));
        console.log("Arbitrator set to:", arbitrator);
        console.log("Deployer:", deployer);
        
        return escrow;
    }
}


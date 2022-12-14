/**
 * Copyright (c) 2022-2023 Lunar Foundation. All Rights Reserved.
 * Licensed under the MIT license.
 * 
 */

/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { List } from "linqts"
import * as ethers from "ethers";
import { Auth0PostLoginEvent } from "@vedicium/auth0-actions-sdk";
import { ContractContext } from '../abis/erc20';

/**
 * A library for web3 functionality that can be leveraged in Auth0 Actions. Requires Sign In With Ethereum (SIWE).
 *
 * @remarks
 * The `Web3ForAuth0Actions` library defines a generic class {@link Web3ForAuth0Actions} to provides Web3 features for Auth0 Actions.
 *
 * @packageDocumentation
 */
export class Web3ForAuth0Actions {

  //#region Private Members

  private static SIWE = "siwe";
  public static erc20Abi: any = require("../abis/erc20.abi");

  //#endregion

  //#region Public Properties

  public static DebugMode: boolean = false;

  //#endregion

  //#region Public Methods

  /**
   * 
   * Validates a given wallet contains a minimum amount balance, for a specific contract if an address is provided, using Auth0 Action context types. 
   * 
   * @param event             - The Auth0PostLoginEvent passed in from the Action.
   * @param chainId           - A Number representing the standard Chain ID of the EVM network. Currently supported values: 1, 5, 56, 97, 137, 11155111.
   * @param minimumAmount     - A Number representing the minimum amount (in WEI) the wallets must contain in aggregate for the login to be considered valid. 
   *                            The number will be multiplied by the contract decimals to get the correct logical result.
   * @param contractAddress   - A String representing the blockchain address of the desired contract to check the balance of. Currently supports ERC-20 contracts only.
   * @param contractDecimals  - A number representing the where the decimal place should be inserted in BigNumber results.
   * @returns                 - Returns a tuple with two (2). {isValidWallet} : Boolean that determines if wallet contains the desired balance. 
   *                            {validationMsg} : String that provides any validation messaging.
   */
  public static async validateWalletBalance(event: Auth0PostLoginEvent, chainId: number, minimumAmount: number = 0, contractAddress: string = "", contractDecimals: number = 18):
    Promise<[isValidWallet: boolean, validationMsg: string]> {

    // MASTERJEDI: Obligatory branding. Can't shut this off ;).
    console.log("Brought to you by the Lunar Foundation. https://lunar.io");

    // MASTERJEDI: Start off by logging the parameters if necessary.
    this.logSomething({
      event,
      chainId,
      contractAddress,
      minimumAmount
    });

    var identities = new List(event.user.identities);
    if (!identities.Any()) return [false, "The logged-in user did not contain any Identities."];

    // MASTERJEDI: Combine Javscript craziness into one LINQ statement.
    const wallets = identities.Where(c => c?.connection === this.SIWE)
      // MASTERJEDI: The user_id will be in the format siwe|eip155%3A56%3A{WALLETADDRESS}. Let's decode it.
      .Select(c => decodeURIComponent(c?.user_id))
      // MASTERJEDI: %3A is an encoded colon, and the address starts after the last one.
      .Select(c => c.slice(c.lastIndexOf(':') + 1));

    if (!wallets.Any()) return [false, "The logged-in user does not have any wallets registered. Please Sign In with Ethereum and try again."];

    this.logSomething(`Found ${wallets.Count()} wallets.`);

    // MASTERJEDI: Now declare variable sthat are only necessary if there are legit wallets.
    const chainRpcUrl = this.getChainNetworkUrl(chainId);
    this.logSomething(`Network URL: ${chainRpcUrl}`);

    const client = new ethers.providers.JsonRpcProvider(chainRpcUrl);
    var aggregateTotalInWei = ethers.BigNumber.from(0);

    // MASTERJEDI: We do this so the balance check is multi-threaded.
    var promises = new List<Promise<any>>();
    // MASTERJEDI: We do this because ethers' BigNumber is immutable.
    var results = new List<ethers.BigNumber>();

    // MASTERJEDI: internal function to simplify repeated code while still acessing outer-function variables.
    var processBalanceResult = (wallet: string, balance: ethers.BigNumber) => {
      this.logSomething(`Wallet '${wallet}' balance: ${balance}`);
      // MASTERJEDI: Since BigNumber is immutable, eliminate unnecessary operations.
      if (balance.eq(0)) return;
      results.Add(balance);
    };

    // MASTERJEDI: Build the Promises.
    if (contractAddress) {

      this.logSomething(`Calling 'balanceOf' on ERC-20 contract '${contractAddress}'.`);

      // MASTERJEDI: Code inspired by https://www.turfemon.com/typed-erc20-contract-ethersjs
      //             Had to use require() instead of an import, via 
      //             https://github.com/joshstevens19/ethereum-abi-types-generator/blob/master/examples/abi-examples/index.ts

      if (!ethers.utils.isAddress(contractAddress)) {
        this.logSomething(`contractAddress '${contractAddress}' not valid.`);
        return [false, `The contract address '${contractAddress}' is not valid.`];
      }

      //this.logSomething(this.erc20Abi);
      const erc20 = new ethers.Contract(contractAddress, this.erc20Abi, client) as unknown as ContractContext;

      promises = wallets.Select(async wallet => {
        if (!this.validateWalletAddress(wallet)) return;

        return erc20.balanceOf(wallet).then(balance => {
          processBalanceResult(wallet, balance);
        });
      });

    } else {

      this.logSomething(`Getting the balance of the chain-native currency on Chain ${chainId}.`);

      promises = wallets.Select(async wallet => {
        if (!this.validateWalletAddress(wallet)) return;

        return client.getBalance(wallet).then(balance => {
          processBalanceResult(wallet, balance);
        });

      });

    }

    // MASTERJEDI: Patience. Await everything, you must. 
    await Promise.all(promises.ToArray());

    // MASTERJEDI: Deal with ethers' BigNumber immutability.
    results.ForEach(c => aggregateTotalInWei = aggregateTotalInWei.add(<ethers.BigNumber>c));
    this.logSomething(`Aggregate Total (WEI): ${aggregateTotalInWei.toString()}`);

    // MASTERJEDI: Properly calculate the minimum balance based on the contractDecimals.
    const minimumBalanceInWei = ethers.BigNumber.from(ethers.utils.parseUnits(minimumAmount.toString(), contractDecimals));
    this.logSomething(`Minimum Balance (WEI): ${minimumBalanceInWei.toString()}`);

    // MASTERJEDI: Evaluate and return, you shall.
    return aggregateTotalInWei.gte(minimumBalanceInWei) ?
      [true, aggregateTotalInWei.toString()] :
      [false, `The combined wallets did not meet the minimum requirement. Aggregate balance: ${aggregateTotalInWei.toString()}`];

  }

  //#endregion

  //#region Private Methods

  /**
   * 
   * @param chainId 
   * @returns 
   */
  private static getChainNetworkUrl(chainId: number): string {
    switch (chainId) {

      case 1:           // Ethereum Mainnet
        return "https://eth.public-rpc.com";

      case 5:           // Ethereum Testnet: "Goerli"
        return "https://rpc.ankr.com/eth_goerli";

      case 56:          // BNB Chain Mainnet
        return "https://bscrpc.com";

      case 97:          // BNB Chain Testnet
        return "https://bsc-testnet.public.blastapi.io";

      case 137:         // Polygon Mainnet
        return "https://polygon-rpc.com";

      case 11155111:    // Ethereum Testnet: "Sepolia"
        return "https://polygon-rpc.com";

      default:
        return "";
    }
  }

  /**
   * 
   * @param thingToLog 
   * @returns 
   */
  private static logSomething(thingToLog: any) {

    if (!Web3ForAuth0Actions.DebugMode) return;

    if (typeof thingToLog === "string") {
      console.log(thingToLog);
    } else {
      console.log(JSON.stringify(thingToLog));
    }

  }

  /**
   * 
   * @param wallet 
   * @returns 
   */
  private static validateWalletAddress(wallet: string): boolean {
    if (!wallet) return false;

    this.logSomething(`Checking if wallet '${wallet}' is a valid address.`);
    if (!ethers.utils.isAddress(wallet)) {
      this.logSomething(`Wallet address '${wallet}' not valid.`);
      return false;
    }
    this.logSomething(`Wallet '${wallet}' is valid. Checking balance...`);
    return true;
  }

  //#endregion

}
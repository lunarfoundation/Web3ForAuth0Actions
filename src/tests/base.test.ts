/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import * as mocha from 'mocha';
import * as ethers from 'ethers';
import { Web3ForAuth0Actions } from "../base";
import { Auth0PostLoginEvent } from "@vedicium/auth0-actions-sdk";
import { Organization as Auth0Organization, User as Auth0User, UsersManager } from 'auth0';

/**
 * Base Test
 * Test our Web3ForAuth0Actions Base
 *  @see https://tsdoc.org/pages/spec/tag_kinds/ for tsDoc standards
*/

/*
* Unit Test Setup
*/
beforeEach(async () => {
    //SHEPARD: 
});

/*
 * Unit Tests | Base
*/
describe("Web3ForAuth0Actions Tests | Base", () => {
    // Public Members
    const LNRv2ContractAddress = "0xc1A59a17F87ba6651Eb8E8F707db7672647c45bD";
    const LNRv2LiquidityPoolAddress = "0x6A1FFe04D63f892F079C30fB619b8db5fE17fF9c"

    describe("Check Native Token Balance | Single Wallet | Chain 56 | 1 Minimum | Zero Balance", async () => {
        it("Should not pass validation because the wallet has no BNB.", async () => {
            let auth0Event: Auth0PostLoginEvent =
            {
                user: {
                    identities: [
                        {
                            "provider": "oauth2",
                            "user_id": "siwe|eip155%3A1%3A0x1F2BC20C4A2c441D5001C40E82704422775366B5",
                            "connection": "siwe",
                            "isSocial": true
                        }
                    ],
                },
                client: { client_id: "", metadata: {}, name: "" },
                connection: { id: "", name: "", strategy: "" },
                request: { body: {}, geoip: {}, method: "", query: {} },
                stats: { logins_count: 0 },
                tenant: { id: "" },
                transaction: { acr_values: [], locale: "", requested_scopes: [], ui_locales: [] }
            };

            Web3ForAuth0Actions.DebugMode = true;
            let [isValidReturn, returnMsg] = await Web3ForAuth0Actions.validateWalletBalance(auth0Event, 56, 1);

            console.log(`Test - isValidReturn: ${isValidReturn}`);
            console.log(`Test - returnMessage: ${returnMsg}`);

            expect(isValidReturn).to.eq(false);
            expect(returnMsg).to.contain('The combined wallets did not meet the minimum requirement.');
        });
    });

    describe("Contract Token Balance | Single Wallet | Chain 56 | 1 Minimum | Zero Balance", async () => {
        it("Should not pass validation because the wallet has no contract tokens.", async () => {
            // MASTERJEDI: Create an identity with the LNR v2 Deployer as the wallet address.
            let auth0Event: Auth0PostLoginEvent =
            {
                user: {
                    identities: [
                        {
                            "provider": "oauth2",
                            "user_id": "siwe|eip155%3A1%3A0x8C1DF8d7BcBE1395Ef66508F76a8732EaB65FBeE",
                            "connection": "siwe",
                            "isSocial": true
                        }
                    ],
                },
                client: { client_id: "", metadata: {}, name: "" },
                connection: { id: "", name: "", strategy: "" },
                request: { body: {}, geoip: {}, method: "", query: {} },
                stats: { logins_count: 0 },
                tenant: { id: "" },
                transaction: { acr_values: [], locale: "", requested_scopes: [], ui_locales: [] }
            };

            Web3ForAuth0Actions.DebugMode = true;
            let [isValidReturn, returnMsg] = await Web3ForAuth0Actions.validateWalletBalance(auth0Event, 56, 1, LNRv2ContractAddress);

            console.log(`Test - isValidReturn: ${isValidReturn}`);
            console.log(`Test - returnMessage: ${returnMsg}`);

            expect(isValidReturn).to.eq(false);
            expect(returnMsg).to.contain('The combined wallets did not meet the minimum requirement.');
        });
    });

    describe("Contract Token Balance | Single Wallet | Chain 56 | 1 Minimum | Huge Balance", async () => {
        it("Should pass validation because the wallet has a crapload of contract tokens.", async () => {
            // MASTERJEDI: Create an identity with the LNR v2 LP as the wallet address.
            let auth0Event: Auth0PostLoginEvent =
            {
                user: {
                    identities: [
                        {
                            "provider": "oauth2",
                            "user_id": "siwe|eip155%3A1%3A0x6A1FFe04D63f892F079C30fB619b8db5fE17fF9c",
                            "connection": "siwe",
                            "isSocial": true
                        }
                    ],
                },
                client: { client_id: "", metadata: {}, name: "" },
                connection: { id: "", name: "", strategy: "" },
                request: { body: {}, geoip: {}, method: "", query: {} },
                stats: { logins_count: 0 },
                tenant: { id: "" },
                transaction: { acr_values: [], locale: "", requested_scopes: [], ui_locales: [] }
            };

            Web3ForAuth0Actions.DebugMode = true;
            let [isValidReturn, returnMsg] = await Web3ForAuth0Actions.validateWalletBalance(auth0Event, 56, 1, LNRv2ContractAddress);

            console.log(`Test - isValidReturn: ${isValidReturn}`);
            console.log(`Test - returnMessage: ${returnMsg}`);

            expect(isValidReturn).to.eq(true);
            expect(ethers.BigNumber.from(returnMsg).gte(1)).to.eq(true);
        });
    });

});

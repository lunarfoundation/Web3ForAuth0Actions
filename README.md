<div align="center">
    <img src="https://pbs.twimg.com/profile_images/1580214450430177280/J643pct6_400x400.jpg" width="150" alt="Lunar Foundation Logo" />
    <h1> 
    <a href="https://www.lunar.io/" target="_blank" >Lunar Foundation </a>
    </h1>
    <h2>The future of money is digital.</h2>
</div>

<div align="center">
<br /> 

[![NPM Package][npm-badge]][npm-pkg-link]

</div>

## Web3ForAuth0Actions
Brought to you by the Lunar Foundation. https://lunar.io

A library for web3 functionality that can be leveraged in Auth0 Actions. Requires [Sign In With Ethereum](https://marketplace.auth0.com/integrations/siwe) (SIWE). 

## Getting Started

1. Open your Auth0 management console and navigate to 'Actions | Library' in the left-hand sidebar.
2. Click "Build Custom" in the header.
    - Select "Login / Post Login".
    - Select "Node 16" for the Runtime.
    - Click the "Create" button.
3. Click on the "Dependencies" icon in the grey editor (the box icon).
    - Type "web3-for-auth0-actions" in the textbox and click "Create".
4. Paste in the following code :
```javascript
exports.onExecutePostLogin = async (event, api) => {

  // SHEPARD: If you have other apps that don't use this Action, exclude those from execution via Rules or Actions.
  if (event.client.client_id !== 'YOUR APP ID HERE') return;

  const { Web3ForAuth0Actions } = require("web3-for-auth0-actions");
  const ContractAddress = "YOUR CONTRACT ADDRESS HERE";

  Web3ForAuth0Actions.DebugMode = true;
  // SHEPARD: Chain Id '56' is the BNB Chain Mainnet. 
  let [isValidReturn, returnMessage] = await Web3ForAuth0Actions.validateWalletBalance(event, 56, 1, ContractAddress);
  console.log(`IsValidReturn: ${isValidReturn}`);
  console.log(`ReturnMessage: ${returnMessage}`);
  
  // SHEPARD: Bounce anyone that doesn't have the minimum balance in their wallet.
  if (!isValidReturn) {
    api.access.deny(returnMessage);
  }
};
```
5. Click "Deploy" in the top right-hand corner.
6. Click "Flows" under "Actions" in the left-hand side bar.
7. Click "Login".
8. On the right-hand side, under "Add Action", select "Custom".
9. Drag your new Action into the Flow area.
10. Click "Apply"
11. Profit!!!

You now have some functioning badassery! 

<!-- Link References -->

[npm-badge]: https://img.shields.io/npm/v/web3-for-auth0-actions?color=%236639E4&logo=NPM&style=for-the-badge
[npm-pkg-link]: https://www.npmjs.com/package/web3-for-auth0-actions
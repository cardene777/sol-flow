// OpenZeppelin だけを import する、アップロードを模した .sol の組。
export const openzeppelinOnlyFiles = [
  {
    path: 'contracts/Token.sol',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor() ERC20("Token", "TKN") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
`,
  },
  {
    path: 'contracts/Vault.sol',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Token.sol";

contract Vault {
    Token public token;

    constructor(Token token_) {
        token = token_;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
    }
}
`,
  },
];

// 契約を 1 つも含まない .sol。
export const noContractFiles = [
  {
    path: 'contracts/Empty.sol',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
`,
  },
];

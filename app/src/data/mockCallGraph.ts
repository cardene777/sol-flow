import type { CallGraph } from '@/types/callGraph';

export const mockCallGraph: CallGraph = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  projectName: 'SC Protocol',
  structure: {
    name: 'contracts',
    type: 'directory',
    path: 'contracts',
    children: [
      {
        name: 'core',
        type: 'directory',
        path: 'contracts/core',
        children: [
          {
            name: 'Ownable',
            type: 'directory',
            path: 'contracts/core/Ownable',
            children: [
              {
                name: 'Ownable.sol',
                type: 'file',
                path: 'contracts/core/Ownable/functions/Ownable.sol',
                contractName: 'Ownable',
              },
            ],
          },
        ],
      },
      {
        name: 'sc',
        type: 'directory',
        path: 'contracts/sc',
        children: [
          {
            name: 'ERC721',
            type: 'directory',
            path: 'contracts/sc/ERC721',
            children: [
              {
                name: 'ERC721.sol',
                type: 'file',
                path: 'contracts/sc/ERC721/functions/ERC721.sol',
                contractName: 'ERC721',
              },
              {
                name: 'ERC721Lib.sol',
                type: 'file',
                path: 'contracts/sc/ERC721/libs/ERC721Lib.sol',
                contractName: 'ERC721Lib',
              },
            ],
          },
        ],
      },
    ],
  },
  contracts: [
    {
      name: 'ERC721',
      kind: 'contract',
      category: 'token',
      filePath: 'contracts/sc/ERC721/functions/ERC721.sol',
      inherits: ['Ownable'],
      implements: ['IERC721'],
      usesLibraries: ['ERC721Lib'],
      imports: [
        { name: 'Storage', path: '../storages/Storage.sol', isExternal: false },
        { name: 'ERC721Lib', path: '../libs/ERC721Lib.sol', isExternal: false },
        { name: 'Ownable', path: '../../../core/Ownable/functions/Ownable.sol', isExternal: false },
      ],
      externalFunctions: [
        {
          name: 'balanceOf',
          signature: 'balanceOf(address)',
          selector: '0x70a08231',
          visibility: 'public',
          stateMutability: 'view',
          parameters: [{ name: 'owner', type: 'address' }],
          returnValues: [{ name: '', type: 'uint256' }],
          calls: [{ target: 'ERC721Lib.balanceOf', type: 'library' }],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 45,
          sourceCode: `function balanceOf(address owner) public view returns (uint256) {
    if (owner == address(0)) {
        revert ERC721InvalidReceiver(address(0));
    }
    return ERC721Lib.balanceOf(owner);
}`,
        },
        {
          name: 'ownerOf',
          signature: 'ownerOf(uint256)',
          selector: '0x6352211e',
          visibility: 'public',
          stateMutability: 'view',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [{ name: '', type: 'address' }],
          calls: [{ target: 'ERC721Lib.ownerOf', type: 'library' }],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 52,
          sourceCode: `function ownerOf(uint256 tokenId) public view returns (address) {
    return ERC721Lib.ownerOf(tokenId);
}`,
        },
        {
          name: 'getApproved',
          signature: 'getApproved(uint256)',
          selector: '0x081812fc',
          visibility: 'public',
          stateMutability: 'view',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [{ name: '', type: 'address' }],
          calls: [{ target: 'ERC721Lib.getApproved', type: 'library' }],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 56,
          sourceCode: `function getApproved(uint256 tokenId) public view returns (address) {
    return ERC721Lib.getApproved(tokenId);
}`,
        },
        {
          name: 'transferFrom',
          signature: 'transferFrom(address,address,uint256)',
          selector: '0x23b872dd',
          visibility: 'public',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [{ target: '_update', type: 'internal' }],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 60,
          sourceCode: `function transferFrom(
    address from,
    address to,
    uint256 tokenId
) public {
    if (to == address(0)) {
        revert ERC721InvalidReceiver(address(0));
    }

    address previousOwner = _update(to, tokenId, msg.sender);

    if (previousOwner != from) {
        revert ERC721IncorrectOwner(from, tokenId, previousOwner);
    }
}`,
        },
        {
          name: 'approve',
          signature: 'approve(address,uint256)',
          selector: '0x095ea7b3',
          visibility: 'public',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [{ target: 'ERC721Lib.approve', type: 'library' }],
          emits: ['Approval'],
          modifiers: [],
          isVirtual: false,
          startLine: 76,
          sourceCode: `function approve(address to, uint256 tokenId) public {
    address owner = ownerOf(tokenId);

    if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) {
        revert ERC721InvalidSender(msg.sender);
    }

    ERC721Lib.approve(to, tokenId);
    emit Approval(owner, to, tokenId);
}`,
        },
        {
          name: 'setApprovalForAll',
          signature: 'setApprovalForAll(address,bool)',
          selector: '0xa22cb465',
          visibility: 'public',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'operator', type: 'address' },
            { name: 'approved', type: 'bool' },
          ],
          returnValues: [],
          calls: [{ target: 'ERC721Lib.setApprovalForAll', type: 'library' }],
          emits: ['ApprovalForAll'],
          modifiers: [],
          isVirtual: false,
          startLine: 87,
          sourceCode: `function setApprovalForAll(address operator, bool approved) public {
    if (operator == address(0)) {
        revert ERC721InvalidReceiver(address(0));
    }

    ERC721Lib.setApprovalForAll(msg.sender, operator, approved);
    emit ApprovalForAll(msg.sender, operator, approved);
}`,
        },
      ],
      internalFunctions: [
        {
          name: '_update',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'auth', type: 'address' },
          ],
          returnValues: [{ name: '', type: 'address' }],
          calls: [{ target: 'ERC721Lib.update', type: 'library' }],
          emits: [],
          isVirtual: true,
          startLine: 96,
          sourceCode: `function _update(
    address to,
    uint256 tokenId,
    address auth
) internal virtual returns (address) {
    return ERC721Lib.update(to, tokenId, auth);
}`,
        },
        {
          name: '_mint',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [{ target: '_update', type: 'internal' }],
          emits: [],
          isVirtual: false,
          startLine: 104,
          sourceCode: `function _mint(address to, uint256 tokenId) internal {
    if (to == address(0)) {
        revert ERC721InvalidReceiver(address(0));
    }

    address previousOwner = _update(to, tokenId, address(0));

    if (previousOwner != address(0)) {
        revert ERC721InvalidSender(previousOwner);
    }
}`,
        },
        {
          name: '_burn',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [],
          calls: [{ target: '_update', type: 'internal' }],
          emits: [],
          isVirtual: false,
          startLine: 116,
          sourceCode: `function _burn(uint256 tokenId) internal {
    address previousOwner = _update(address(0), tokenId, address(0));

    if (previousOwner == address(0)) {
        revert ERC721InvalidSender(address(0));
    }
}`,
        },
      ],
      events: [
        {
          name: 'Transfer',
          parameters: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
          ],
        },
        {
          name: 'Approval',
          parameters: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'approved', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
          ],
        },
        {
          name: 'ApprovalForAll',
          parameters: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'operator', type: 'address', indexed: true },
            { name: 'approved', type: 'bool', indexed: false },
          ],
        },
      ],
      errors: [
        {
          name: 'ERC721InvalidReceiver',
          parameters: [{ name: 'receiver', type: 'address' }],
        },
        {
          name: 'ERC721IncorrectOwner',
          parameters: [
            { name: 'sender', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'owner', type: 'address' },
          ],
        },
        {
          name: 'ERC721InvalidSender',
          parameters: [{ name: 'sender', type: 'address' }],
        },
      ],
    },
    {
      name: 'ERC721Lib',
      kind: 'library',
      category: 'library',
      filePath: 'contracts/sc/ERC721/libs/ERC721Lib.sol',
      inherits: [],
      implements: [],
      usesLibraries: [],
      imports: [{ name: 'Storage', alias: 'ERC721Storage', path: '../storages/Storage.sol', isExternal: false }],
      externalFunctions: [],
      internalFunctions: [
        {
          name: 'balanceOf',
          visibility: 'internal',
          stateMutability: 'view',
          parameters: [{ name: 'owner', type: 'address' }],
          returnValues: [{ name: '', type: 'uint256' }],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 15,
          sourceCode: `function balanceOf(address owner) internal view returns (uint256) {
    ERC721Storage storage $ = _getStorage();
    return $._balances[owner];
}`,
        },
        {
          name: 'ownerOf',
          visibility: 'internal',
          stateMutability: 'view',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [{ name: '', type: 'address' }],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 20,
          sourceCode: `function ownerOf(uint256 tokenId) internal view returns (address) {
    ERC721Storage storage $ = _getStorage();
    address owner = $._owners[tokenId];
    if (owner == address(0)) {
        revert ERC721NonexistentToken(tokenId);
    }
    return owner;
}`,
        },
        {
          name: 'getApproved',
          visibility: 'internal',
          stateMutability: 'view',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [{ name: '', type: 'address' }],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 29,
          sourceCode: `function getApproved(uint256 tokenId) internal view returns (address) {
    ERC721Storage storage $ = _getStorage();
    return $._tokenApprovals[tokenId];
}`,
        },
        {
          name: 'update',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'auth', type: 'address' },
          ],
          returnValues: [{ name: '', type: 'address' }],
          calls: [
            { target: '_checkAuthorized', type: 'internal' },
            { target: '_decreaseBalance', type: 'internal' },
            { target: '_increaseBalance', type: 'internal' },
          ],
          emits: ['Transfer'],
          isVirtual: false,
          startLine: 34,
          sourceCode: `function update(
    address to,
    uint256 tokenId,
    address auth
) internal returns (address) {
    ERC721Storage storage $ = _getStorage();
    address from = $._owners[tokenId];

    // Perform auth check
    if (auth != address(0)) {
        _checkAuthorized(from, auth, tokenId);
    }

    // Update balances
    if (from != address(0)) {
        _decreaseBalance(from, 1);
        delete $._tokenApprovals[tokenId];
    }

    if (to != address(0)) {
        _increaseBalance(to, 1);
    }

    $._owners[tokenId] = to;
    emit Transfer(from, to, tokenId);

    return from;
}`,
        },
        {
          name: 'approve',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: ['Approval'],
          isVirtual: false,
          startLine: 63,
          sourceCode: `function approve(address to, uint256 tokenId) internal {
    ERC721Storage storage $ = _getStorage();
    $._tokenApprovals[tokenId] = to;
}`,
        },
        {
          name: 'setApprovalForAll',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'owner', type: 'address' },
            { name: 'operator', type: 'address' },
            { name: 'approved', type: 'bool' },
          ],
          returnValues: [],
          calls: [],
          emits: ['ApprovalForAll'],
          isVirtual: false,
          startLine: 68,
          sourceCode: `function setApprovalForAll(
    address owner,
    address operator,
    bool approved
) internal {
    ERC721Storage storage $ = _getStorage();
    $._operatorApprovals[owner][operator] = approved;
}`,
        },
        {
          name: '_checkAuthorized',
          visibility: 'internal',
          stateMutability: 'view',
          parameters: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 77,
          sourceCode: `function _checkAuthorized(
    address owner,
    address spender,
    uint256 tokenId
) internal view {
    if (spender != owner &&
        !isApprovedForAll(owner, spender) &&
        getApproved(tokenId) != spender) {
        revert ERC721InsufficientApproval(spender, tokenId);
    }
}`,
        },
        {
          name: '_decreaseBalance',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'account', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 89,
          sourceCode: `function _decreaseBalance(address account, uint256 amount) internal {
    ERC721Storage storage $ = _getStorage();
    unchecked {
        $._balances[account] -= amount;
    }
}`,
        },
        {
          name: '_increaseBalance',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'account', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 96,
          sourceCode: `function _increaseBalance(address account, uint256 amount) internal {
    ERC721Storage storage $ = _getStorage();
    unchecked {
        $._balances[account] += amount;
    }
}`,
        },
      ],
      events: [],
      errors: [],
    },
    {
      name: 'Ownable',
      kind: 'contract',
      category: 'access',
      filePath: 'contracts/core/Ownable/functions/Ownable.sol',
      inherits: [],
      implements: [],
      usesLibraries: [],
      imports: [],
      externalFunctions: [
        {
          name: 'owner',
          signature: 'owner()',
          selector: '0x8da5cb5b',
          visibility: 'public',
          stateMutability: 'view',
          parameters: [],
          returnValues: [{ name: '', type: 'address' }],
          calls: [],
          emits: [],
          modifiers: [],
          isVirtual: true,
          startLine: 25,
          sourceCode: `function owner() public view virtual returns (address) {
    return _owner;
}`,
        },
        {
          name: 'renounceOwnership',
          signature: 'renounceOwnership()',
          selector: '0x715018a6',
          visibility: 'public',
          stateMutability: 'nonpayable',
          parameters: [],
          returnValues: [],
          calls: [{ target: '_transferOwnership', type: 'internal' }],
          emits: [],
          modifiers: ['onlyOwner'],
          isVirtual: true,
          startLine: 29,
          sourceCode: `function renounceOwnership() public virtual onlyOwner {
    _transferOwnership(address(0));
}`,
        },
        {
          name: 'transferOwnership',
          signature: 'transferOwnership(address)',
          selector: '0xf2fde38b',
          visibility: 'public',
          stateMutability: 'nonpayable',
          parameters: [{ name: 'newOwner', type: 'address' }],
          returnValues: [],
          calls: [{ target: '_transferOwnership', type: 'internal' }],
          emits: [],
          modifiers: ['onlyOwner'],
          isVirtual: true,
          startLine: 33,
          sourceCode: `function transferOwnership(address newOwner) public virtual onlyOwner {
    if (newOwner == address(0)) {
        revert OwnableInvalidOwner(address(0));
    }
    _transferOwnership(newOwner);
}`,
        },
      ],
      internalFunctions: [
        {
          name: '_checkOwner',
          visibility: 'internal',
          stateMutability: 'view',
          parameters: [],
          returnValues: [],
          calls: [],
          emits: [],
          isVirtual: false,
          startLine: 40,
          sourceCode: `function _checkOwner() internal view {
    if (owner() != msg.sender) {
        revert OwnableUnauthorizedAccount(msg.sender);
    }
}`,
        },
        {
          name: '_transferOwnership',
          visibility: 'internal',
          stateMutability: 'nonpayable',
          parameters: [{ name: 'newOwner', type: 'address' }],
          returnValues: [],
          calls: [],
          emits: ['OwnershipTransferred'],
          isVirtual: true,
          startLine: 46,
          sourceCode: `function _transferOwnership(address newOwner) internal virtual {
    address oldOwner = _owner;
    _owner = newOwner;
    emit OwnershipTransferred(oldOwner, newOwner);
}`,
        },
      ],
      events: [
        {
          name: 'OwnershipTransferred',
          parameters: [
            { name: 'previousOwner', type: 'address', indexed: true },
            { name: 'newOwner', type: 'address', indexed: true },
          ],
        },
      ],
      errors: [
        {
          name: 'OwnableUnauthorizedAccount',
          parameters: [{ name: 'account', type: 'address' }],
        },
        {
          name: 'OwnableInvalidOwner',
          parameters: [{ name: 'owner', type: 'address' }],
        },
      ],
    },
    {
      name: 'IERC721',
      kind: 'interface',
      category: 'interface',
      filePath: 'contracts/interfaces/IERC721.sol',
      inherits: [],
      implements: [],
      usesLibraries: [],
      imports: [],
      externalFunctions: [
        {
          name: 'balanceOf',
          signature: 'balanceOf(address)',
          selector: '0x70a08231',
          visibility: 'external',
          stateMutability: 'view',
          parameters: [{ name: 'owner', type: 'address' }],
          returnValues: [{ name: '', type: 'uint256' }],
          calls: [],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 10,
          sourceCode: `function balanceOf(address owner) external view returns (uint256);`,
        },
        {
          name: 'ownerOf',
          signature: 'ownerOf(uint256)',
          selector: '0x6352211e',
          visibility: 'external',
          stateMutability: 'view',
          parameters: [{ name: 'tokenId', type: 'uint256' }],
          returnValues: [{ name: '', type: 'address' }],
          calls: [],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 12,
          sourceCode: `function ownerOf(uint256 tokenId) external view returns (address);`,
        },
        {
          name: 'transferFrom',
          signature: 'transferFrom(address,address,uint256)',
          selector: '0x23b872dd',
          visibility: 'external',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 14,
          sourceCode: `function transferFrom(address from, address to, uint256 tokenId) external;`,
        },
        {
          name: 'approve',
          signature: 'approve(address,uint256)',
          selector: '0x095ea7b3',
          visibility: 'external',
          stateMutability: 'nonpayable',
          parameters: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          returnValues: [],
          calls: [],
          emits: [],
          modifiers: [],
          isVirtual: false,
          startLine: 16,
          sourceCode: `function approve(address to, uint256 tokenId) external;`,
        },
      ],
      internalFunctions: [],
      events: [],
      errors: [],
    },
  ],
  dependencies: [
    { from: 'ERC721', to: 'IERC721', type: 'implements' },
    { from: 'ERC721', to: 'Ownable', type: 'inherits' },
    {
      from: 'ERC721',
      to: 'ERC721Lib',
      type: 'uses',
      functions: ['balanceOf', 'ownerOf', 'getApproved', 'update', 'approve', 'setApprovalForAll'],
    },
  ],
  proxyGroups: [],
  stats: {
    totalContracts: 2,
    totalLibraries: 1,
    totalInterfaces: 1,
    totalFunctions: 17,
  },
};

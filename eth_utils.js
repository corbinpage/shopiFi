const ethers = require('ethers');

const {
  dynamoDbLibCall,
  convertTokenToWei
  } = require('./utils');

module.exports.getProvider = (network) => {
  const infuraApiKey = process.env.INFURA_API_KEY
  return new ethers.providers.InfuraProvider(
    network,
    infuraApiKey
  )
}

module.exports.getWallet = (provider) => {
  const privateKey = process.env.DEFI_ADMIN_PRIVATE_KEY
  return new ethers.Wallet(privateKey, provider);
}

module.exports.getcTokenContract = async (provider, wallet) => {
  const network = await provider.getNetwork()
  const contractAddress = {
    homestead: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    rinkeby: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14'
  }
  const abiJson = require('./contractAbis/cDai.json')

  let contract = new ethers.Contract(
    contractAddress[network.name],
    abiJson,
    provider
  )

  return contract.connect(wallet)
}

module.exports.getDaiTokenContract = async(provider, wallet) => {
  const network = await provider.getNetwork()
  const contractAddress = {
    homestead: '0x6b175474e89094c44da98b954eedeac495271d0f',
    rinkeby: '0x3ec445313bffe7b0fe1d3dffaf1c2d450c584239'
  }
  const abiJson = require('./contractAbis/erc20.json')

  let contract = new ethers.Contract(
    contractAddress[network.name],
    abiJson,
    provider
  )

  return contract.connect(wallet)
}

module.exports.getTokenContract = async(tokenSymbol, provider, wallet) => {
  const network = await provider.getNetwork()
  const contracts = {
    "DAI": {
      homestead: '0x6b175474e89094c44da98b954eedeac495271d0f',
      rinkeby: '0x3ec445313bffe7b0fe1d3dffaf1c2d450c584239'
    },
    "cDAI": {
      homestead: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
      rinkeby: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14'
    }
  }

  const abiJson = require('./contractAbis/erc20.json')

  let contract = new ethers.Contract(
    contracts[tokenSymbol][network.name],
    abiJson,
    provider
  )

  return contract.connect(wallet)
}

module.exports.createEthTransaction = async (data, network) => {
  const params = {
    TableName: 'ETH_TRANSACTIONS',
    Item: {
      transactionHash: data.hash,
      network: network,
      txStatus: 'Pending',
      txData: 'data',
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDbLibCall("put", params);
    return params.Item
  } catch (e) {
    console.error(e)
  }
}

module.exports.updateEthTransaction = async (data) => {
  const params = {
    TableName: 'ETH_TRANSACTIONS',
    Key: {
      transactionHash: data.transactionHash
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET txData = :txData, completedAt = :completedAt, txStatus = :txStatus",
    ExpressionAttributeValues: {
      ":txData": data || null,
      ":txStatus": 'Complete',
      ":completedAt": Date.now()
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLibCall("update", params);
    return params.Item
  } catch (e) {
    console.error(e)
  }
}
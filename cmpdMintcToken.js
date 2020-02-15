const ethers = require('ethers');

const {
  dynamoDbLibCall,
  getMessageFromSNS,
  convertTokenToWei
  } = require('./utils');

const {
  getProvider,
  getWallet,
  getcTokenContract,
  getTokenContract,
  createEthTransaction,
  updateEthTransaction
  } = require('./eth_utils');

module.exports.start = async (event) => {
  const data = {
    network: 'homestead', // 'homestead'
    amount: 1,
    tokenSymbol: 'DAI'
  }
  const tokenAmount = convertTokenToWei(data.amount)
  const provider = getProvider(data.network)
  const wallet = getWallet(provider)
  let tokenContract
  let ctokenContract

  if(data.tokenSymbol === 'DAI') {
    tokenContract = await getTokenContract(provider, wallet)    
    ctokenContract = await getcTokenContract(provider, wallet)    
  }

  // Approve cToken contract to move the token
  let approvalTx = await tokenContract.approve(ctokenContract.address, tokenAmount)
  let approvalRecord = await createEthTransaction(approvalTx, data.network)
  console.log('Approval pending tx', approvalTx)

  let finalApprovalTx = await approvalTx.wait()
  approvalRecord = await updateEthTransaction(finalApprovalTx)
  console.log('Approval final tx', finalApprovalTx)

  // Mint cToken on Compound
  let mintTx = await ctokenContract.mint(tokenAmount, {
    gasLimit: 400000,
    // gasPrice: utils.parseUnits('9.0', 'gwei') // The price (in wei) per unit of gas
  })
  let mintRecord = await createEthTransaction(mintTx, data.network)
  console.log('Mint pending tx', mintTx)

  let finalMintTx = await mintTx.wait()
  mintRecord = await updateEthTransaction(finalMintTx)
  console.log('Mint final tx', finalMintTx)

  return finalMintTx
}
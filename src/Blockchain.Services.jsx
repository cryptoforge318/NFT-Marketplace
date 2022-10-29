import Web3 from 'web3'
import { setGlobalState, getGlobalState, setAlert } from './store'
import abi from './abis/TimelessNFT.json'

const { ethereum } = window
window.web3 = new Web3(ethereum)
window.web3 = new Web3(window.web3.currentProvider)

const getEtheriumContract = async () => {
  const connectedAccount = getGlobalState('connectedAccount')

  if (connectedAccount) {
    const web3 = window.web3
    const networkId = await web3.eth.net.getId()
    const networkData = abi.networks[networkId]

    if (networkData) {
      const contract = new web3.eth.Contract(abi.abi, networkData.address)
      return contract
    } else {
      return null
    }
  } else {
    return getGlobalState('contract')
  }
}

const connectWallet = async () => {
  try {
    if (!ethereum) return alert('Please install Metamask')
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    setGlobalState('connectedAccount', accounts[0].toLowerCase())
  } catch (error) {
    reportError(error)
  }
}

const isWallectConnected = async () => {
  try {
    if (!ethereum) return alert('Please install Metamask')
    const accounts = await ethereum.request({ method: 'eth_accounts' })

    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload()
    })

    window.ethereum.on('accountsChanged', async () => {
      setGlobalState('connectedAccount', accounts[0].toLowerCase())
      await isWallectConnected()
    })

    if (accounts.length) {
      setGlobalState('connectedAccount', accounts[0].toLowerCase())
    } else {
      alert('Please connect wallet.')
      console.log('No accounts found.')
    }
  } catch (error) {
    reportError(error)
  }
}

const structuredNfts = (nfts) => {
  return nfts
    .map((nft) => ({
      id: Number(nft.id),
      owner: nft.owner.toLowerCase(),
      cost: window.web3.utils.fromWei(nft.cost),
      title: nft.title,
      description: nft.description,
      metadataURI: nft.metadataURI,
      timestamp: nft.timestamp,
    }))
    .reverse()
}

const getAllNFTs = async () => {
  try {
    if (!ethereum) return alert('Please install Metamask')

    const contract = await getEtheriumContract()
    const nfts = await contract.methods.getAllNFTs().call()
    const transactions = await contract.methods.getAllTransactions().call()

    setGlobalState('nfts', structuredNfts(nfts))
    setGlobalState('transactions', structuredNfts(transactions))
  } catch (error) {
    reportError(error)
  }
}

const mintNFT = async ({ title, description, metadataURI, price }) => {
  try {
    price = window.web3.utils.toWei(price.toString(), 'ether')
    const contract = await getEtheriumContract()
    const account = getGlobalState('connectedAccount')
    const mintPrice = window.web3.utils.toWei('0.01', 'ether')

    await contract.methods
      .payToMint(title, description, metadataURI, price)
      .send({ from: account, value: mintPrice })

    return true
  } catch (error) {
    reportError(error)
  }
}

const buyNFT = async ({ id, cost }) => {
  try {
    cost = window.web3.utils.toWei(cost.toString(), 'ether')
    const contract = await getEtheriumContract()
    const buyer = getGlobalState('connectedAccount')

    await contract.methods
      .payToBuy(Number(id))
      .send({ from: buyer, value: cost })

    return true
  } catch (error) {
    reportError(error)
  }
}

const updateNFT = async ({ id, cost }) => {
  try {
    cost = window.web3.utils.toWei(cost.toString(), 'ether')
    const contract = await getEtheriumContract()
    const buyer = getGlobalState('connectedAccount')

    await contract.methods.changePrice(Number(id), cost).send({ from: buyer })
  } catch (error) {
    reportError(error)
  }
}

const reportError = (error) => {
  setAlert(JSON.stringify(error), 'red')
  throw new Error('No ethereum object.')
}

export {
  getAllNFTs,
  connectWallet,
  mintNFT,
  buyNFT,
  updateNFT,
  isWallectConnected,
}

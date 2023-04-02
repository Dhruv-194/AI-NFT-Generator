import { useState, useEffect } from 'react';
import { NFTStorage, File } from 'nft.storage'
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import axios from 'axios';

// Components
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';

// ABIs
import NFT from './abis/NFT.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState(null)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [image, setImage] = useState(null)
  const [url, setURL] = useState(null)

  const [isWaiting, setIsWaiting] = useState(false)
  const [message, setMessage] = useState("")

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum) //blockchain connection to our app
    setProvider(provider)


    const network = await provider.getNetwork()
    const nft = new ethers.Contract(config[network.chainId].nft.address, NFT, provider)
    setNFT(nft)

    const name = await nft.name()
    console.log("name", name)
  }

  const submitHandler = async (e) => {
    e.preventDefault()

  if(name==="" || desc === ""){
    window.alert("please provide a name and description")
    return 
  }    

  setIsWaiting(true)
    console.log("submitting..." , name, desc)
  const imageData =  createImage()
  const url = await uploadImage(imageData)

  console.log("url",url)
  await mintImage(url)

  console.log("success!!")

  setIsWaiting(false)
  setMessage("")
  }

  const createImage = async () => {
    console.log('generating image...')
    setMessage("Generating Image...")

    const URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2'

   const response = await axios({
      url: URL ,
      method: 'POST',
      headers:{ 
        Authorization: "Bearer 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",
        Accept: 'application/json',
        'Content-type': 'application/json'

      },
      data:JSON.stringify({
        inputs: desc, options: {wait_for_model: true},
      }),
      responseType:"arraybuffer",
    })

    const type = response.headers['content-type']
    const data = response.data

    const base64data = Buffer.from(data).toString('base64')
    const img = `data:${type};base64,` + base64data
    setImage(img)

    return data
  }

  const uploadImage  = async(imageData) =>{
    console.log("upload image...")
    setMessage("Uploading Image....")

  const nftstorage=  new NFTStorage({
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFFYTU1MUIyMTczYTY3ODQxOTY3NTk3MmMyYzJhQzMzMzI4NzU3OEYiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY4MDQ0NTI0NTQ5NiwibmFtZSI6IkFJLU5GdEltYWdlIn0.ItxlXbp9AbCMUzgz4CveRccIYGlwtqeKRVV6l-Rn_tA"
    })

    const { ipnft } = await nftstorage.store({
      image : new  File([imageData], "image.jpeg", {type: "image/jpeg"}),
      name: name,
      description: desc,
    })

    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
    setURL(url)

    return url
  }

  const mintImage = async(tokenURI) => {
    console.log("waiting for Mint ...")
    setMessage("Waiting for the NFT to mint...")

    const signer = await provider.getSigner()
    const transaction = await nft.connect(signer).mint(tokenURI,{value: ethers.utils.parseUnits("1", "ether")})
    await transaction.wait()
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <div className='form'>
        <form onSubmit={submitHandler}>
          <input type="text" placeholder='a name' onChange={(e)=>{setName(e.target.value)}}></input>
          <input type="text" placeholder='description' onChange={(e)=>{setDesc(e.target.value)}}></input>
          <input type="submit" value = 'generate & mint'></input>
        </form>

        <div className='image'>
          {
            !isWaiting && image ? (
              <img src={image} alt="ai generated img" />
            ): isWaiting ? (
        <div className='image__placeholder'>
        <Spinner animation='border'/>
        <p>{message}</p>
        </div>
            ): (
                <></>
            )}
       
        
        

      </div>
      </div>
      {
        !isWaiting && url && (
          <p> View&nbsp;<a href={url} target="_blank" rel='noreferrer'>Metadata</a></p>
        )
      }
     
      
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";


export default function Recent_Manga (){
  const [shouldKill, setShouldKill] = useState(true)
  const [manga, setManga] = useState([[]])
  const [cover, setCover] = useState('')

  const Get_Manga = async () => {
    try {
      var response = await fetch('http://localhost:8000/recent_manga?page=1')
      .then(response => {
        if(!response.ok){
          throw new Error('Network response was not ok!')
        }
        return response.json()
      })
      .then(data => {
        data = JSON.parse(data)
        setManga(data)
      })
    }
    catch(error){
      console.log('Error has occured!', error)
    }
  }
  const Get_Cover = async () => {
     var response = await fetch('http://localhost:8000/get_cover')
     .then(response => {
      if(!response.ok){
          throw new Error('Network response was not ok!')
        }
        return response.json()
     })
     .then(data => {
      console.log(JSON.parse(data))
      setCover(JSON.parse(data))
      setShouldKill(false)
     })
  }

  if(shouldKill){
    Get_Manga()
    Get_Cover()
  }

  return (
    <main className="home">
      <img src={cover} />
      <div></div>
      <div className="manga-title">{manga[0][0]}</div>
    </main>
  );
}





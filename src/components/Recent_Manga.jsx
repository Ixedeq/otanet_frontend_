import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";


export default function Recent_Manga (){
  const [shouldKill, setShouldKill] = useState(true)

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
        setShouldKill(false)
      })
    }
    catch(error){
      console.log('Error has occured!', error)
    }
  }
  if(shouldKill){
    Get_Manga()
  }
  
  return(
    <div></div>
  )
}

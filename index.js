require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Note = require('./models/note')


const requestLogger = (request, response, next) => {
  console.log('Method: ', request.method)
  console.log('Path: ', request.path)
  console.log('Body: ', request.body)
  console.log('---')
  next()
}

app.use(express.static('dist'))
app.use(cors())
app.use(express.json())
app.use(requestLogger)

const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

mongoose.set('strictQuery',false)
mongoose.connect(url)

// Create a note
app.post('/api/notes/', (request, response) => {
  const body = request.body             // reads JSON parsed body of request and stores it

  if (body.content === undefined) {     // checks if request body has content
    return response.status(400).json({  // if it has no content, returns an error
      error: 'content missing'
    })
  }
  
  const newNote = new Note({            // creates Note based on noteSchema 
    content: body.content,              // using request body
    important: body.important || false,
  })

  newNote.save().then(result => {       // saves newNote to mongoDB collection and returns
    response.json(result)               // it in the response
  })
})

// Fetch all notes
app.get('/api/notes/', (request, response) => {
  Note.find({}).then(fetchedNotes => {
    response.json(fetchedNotes)
  })
})

// Fetch note by id
app.get('/api/notes/:id', (request, response, next) => {

  Note.findById(request.params.id)
    .then(foundNote => {
      if (foundNote) {
        response.json(foundNote)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))

})

// Change a note by id
app.put('/api/notes/:id', (request, response, next) => {
    
  const body = request.body

  const note = {
    content: body.content,
    important: body.important
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))

})

// Delete a note by id
app.delete('/api/notes/:id', (request, response, next) => {
  
  Note.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))

})

const unknownEndpoint = (request, response) => {
  response.status(404).json({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  }

  next(error)

}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

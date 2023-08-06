const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

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
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}))

let notes = [
  {
    id: 1,
    content: "HTML is easy",
    important: true
  },
  {
    id: 2,
    content: "Browser can execute only JavaScript",
    important: false
  },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true
  }
]

app.get('/api/notes/', (request, response) => {
  response.json(notes)
})

app.get('/info/', (request, response) => {
  response.send(`Notes array currently holds ${notes.length} notes`)
})

app.get('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  const note = notes.find(n => n.id === id)
  note? response.send(`Note id: ${id}, note content: ${note.content}, importance: ${note.important.toString()}`)
  : response.status(404).end()
})

app.delete('/api/notes/:id', (request, response) => {
  const id = request.params.id
  notes = notes.filter(n => n.id != id)
  response.status(204).end()
})

app.post('/api/notes/', (request, response) => {
  const {id, content, important} = request.body

  const found = notes.find(n => n.id === id)

  if (found) {
    return response.status(409).json({ error: 'ID must be unique' });
  }

  const newNote = {
    id,
    content,
    important
  }

  notes = notes.concat(newNote)
  response.status(200).json(notes)
})



app.put('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    const {content, important} = request.body
    const found = notes.find(n => n.id === id)

    if (!found) {
      return response.status(400).json({ error: `Note with id ${id} not found`})
    }

    const newNote = {
      id,
      content,
      important
    }
    
    notes = notes.map(n => n.id === id? newNote : n)
    response.status(200).json(notes)

})



const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 5174
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})  
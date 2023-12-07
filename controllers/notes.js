const notesRouter = require("express").Router()
const Note = require("../models/note")
const User = require("../models/user")
const jwt = require("jsonwebtoken")

const getTokenFrom = (req) => {
  const authorization = req.get("authorization")
  if (authorization && authorization.startsWith("Bearer")) {
    return authorization.replace("Bearer ", "")
  }
  return null
}

// Create a note
notesRouter.post("/", async (request, response, next) => {
  const body = request.body // reads JSON parsed body of request and stores it

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" })
  }
  const user = await User.findById(decodedToken.id)

  if (body.content === undefined) {
    // checks if request body has content
    return response.status(400).json({
      // if it has no content, returns an error
      error: "content missing",
    })
  }

  const newNote = new Note({
    // creates Note based on noteSchema
    content: body.content, // using request body
    important: body.important || false,
    user: user.id,
  })

  const savedNote = await newNote.save()
  user.notes = user.notes.concat(savedNote._id)
  await user.save()
  response.status(201).json(savedNote)
})

// Fetch all notes
notesRouter.get("/", async (request, response) => {
  const fetchedNotes = await Note.find({}).populate("user", {
    username: 1,
    name: 1,
  })

  response.json(fetchedNotes)
})

// Fetch note by id
notesRouter.get("/:id", async (request, response, next) => {
  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
})

// Change a note by id
notesRouter.put("/:id", async (request, response, next) => {
  const { content, important } = request.body

  const updatedNote = await Note.findByIdAndUpdate(
    request.params.id,
    { content, important },
    { new: true, runValidators: true, context: "query" }
  )
  response.json(updatedNote)
})

// Delete a note by id
notesRouter.delete("/:id", async (request, response, next) => {
  await Note.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

module.exports = notesRouter

# ArticleService

Example Article CRUD REST service using node and express.

## Development server

Run `node server` for a dev server. Navigate to `http://localhost:3000/`.

## Build

Run `npm install` to build the project.

## ROUTES

POST /login
	username
	password

Once authenticated you can access the secure routes by adding token returned by login under header key x-access-token 

GET /users
POST /users
	username
	password
	confirmPassword
PUT /users/id
	username
	password
	confirmPassword
DELETE /users/id
GET /articles
POST /articles
	title
	image
	description
	publishDate
	modifyDate
PUT /articles/id
	title
	image
	description
	publishDate
	modifyDate
DELETE /articles/id
POST /images
	filename (type file)
GET /images/id




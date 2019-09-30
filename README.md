# ArticleService

Example Article CRUD REST service using node and express.

## Development server

Run `node server` for a dev server. Navigate to `http://localhost:3000/`.

## Build

Run `npm install` to build the project.


## ROUTES

POST /login  
	Login using username and password. Once authenticated you can access the secure routes by adding the security token returned by login under header key _x-access-token_.    
	HEADER:  
		content-type: application/json  
	BODY:  
		username (required)
		password (required)

## SECURE ROUTES

All requests need header key _x-access-token_

GET /users  
	DESCRIPTION:  
		Get users.  
	HEADER:  
		x-access-token: _security token returned by login_  

POST /users  
	DESCRIPTION:  
		Create user.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json
	JSON:  
		username  
		password (required)  
		confirmPassword (required)  

PUT /users/_id_  
	DESCRIPTION:  
		Update user.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json
	JSON:  
		username  
		password (required)  
		confirmPassword (required)  

DELETE /users/_id_  
	DESCRIPTION:  
		Delete user.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json

GET /articles  
	DESCRIPTION:  
		Get articles.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json

POST /articles  
	DESCRIPTION:  
		Create article.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  
	JSON:  
		title  
		image  
		description  
		publishDate  
		modifyDate  

PUT /articles/_id_  
	DESCRIPTION:  
		Update article.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  
	JSON:  
		title  
		image  
		description  
		publishDate  
		modifyDate  

DELETE /articles/_id_  
	DESCRIPTION:  
		Delete article.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  

POST /images  
	DESCRIPTION:  
		Accepts image file upload through form submission.
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  
    action="/images" enctype="multipart/form-data" method="POST" type="file" name="filename"  

GET /images/_id_  
	DESCRIPTION:  
		Get image.  
	HEADER:  
		content-type: application/json  




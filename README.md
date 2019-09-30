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
	RESPONSE:  
		200 security token.  
		403 if wrong login credentials.  
		501 if system error. Contact administrator of service.  

## SECURE ROUTES

All requests need header key _x-access-token_

GET /users  
	DESCRIPTION:  
		Get all users.  
	HEADER:  
		x-access-token: _security token returned by login_  
	RESPONSE:  
		200 JSON array of user objects.  
		403 if invalid security token.  
		501 if system error. Contact administrator of service.  

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
	RESPONSE:  
		200 JSON of created user object.  
		403 if invalid security token.  
		501 if system error. Contact administrator of service.  

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
	RESPONSE:  
		200 JSON of updated user objects.  
		403 if invalid security token.  
		404 if user not found.  
		501 if system error. Contact administrator of service.  

DELETE /users/_id_  
	DESCRIPTION:  
		Delete user.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json
	RESPONSE:  
		200 JSON of deleted user object.  
		403 if invalid security token.  
		404 if user not found.  
		501 if system error. Contact administrator of service.  

GET /articles  
	DESCRIPTION:  
		Get articles.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json
	RESPONSE:  
		200 JSON array of article objects.  
		403 if invalid security token.  
		501 if system error. Contact administrator of service.  

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
	RESPONSE:  
		200 JSON of created article object.  
		403 if invalid security token.  
		501 if system error. Contact administrator of service.  

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
	RESPONSE:  
		200 JSON of updated user objects.  
		403 if invalid security token. 
		404 if article not found.   
		501 if system error. Contact administrator of service.  

DELETE /articles/_id_  
	DESCRIPTION:  
		Delete article.  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  
	RESPONSE:  
		200 JSON of deleted article objects.  
		403 if invalid security token. 
		404 if article not found.   
		501 if system error. Contact administrator of service.  

POST /images  
	DESCRIPTION:  
		Accepts image file upload through form submission. Form attribute: action="/images" enctype="multipart/form-data" method="POST" type="file" name="filename".  
	HEADER:  
		x-access-token: _security token returned by login_  
		content-type: application/json  
	RESPONSE:  
		200 JSON of image metadata.  
    

GET /images/_id_  
	DESCRIPTION:  
		Get image.  
	HEADER:  
		content-type: application/json  
	RESPONSE:  
		200 image  




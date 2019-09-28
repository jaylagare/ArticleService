# ArticleService

Example Article CRUD REST service using node and express.

## Development server

Run `node server` for a dev server. Navigate to `http://localhost:3000/`.

## Build

Run `npm install` to build the project.

## ROUTES

POST /login
	JSON:  
		username (required)
		password (required)

Once authenticated you can access the secure routes by adding the security token returned by login under header key x-access-token 

GET /users  

POST /users  
	JSON:  
		username  
		password (required)  
		confirmPassword (required)  

PUT /users/id  
	JSON:  
		username  
		password (required)  
		confirmPassword (required)  

DELETE /users/id  

GET /articles  

POST /articles  
	JSON:  
		title  
		image  
		description  
		publishDate  
		modifyDate  

PUT /articles/id  
	JSON:  
		title  
		image  
		description  
		publishDate  
		modifyDate  

DELETE /articles/id  

POST /images  
	Accepts file upload through form  
    action="/images" enctype="multipart/form-data" method="POST" type="file" name="filename"  

GET /images/id  




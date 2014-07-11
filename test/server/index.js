var http = require("http");
var achilles = require("../../index.js");

var morgan = require("morgan");
var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");

var router = new achilles.Router();

router.use(morgan());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
	extended:"true"
}));
router.use(cookieParser("double secret"));
router.use(session({
	secret:"fdsdfs",
	saveUninitialized: true,
	resave: true
}));
router.use(serveStatic("public")); 

router.get("/", function(req, res) {
	res.end("Hello World!");
});

http.createServer(router.route).listen(5000);


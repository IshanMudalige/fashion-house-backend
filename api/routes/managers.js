const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    //service:'gmail',
    auth: {
        user: "4c9ee4dbad6ee1",//yourmail@gmail.com
        pass: "d63dd501c21343" //password
    }
});

//------------- get all managers ----------------------
router.get('/', (req, res, next) => {
    User.find({isManager:true})
        .exec()
        .then(doc => {
            res.status(201).json({
                message: doc
            });
        })
        .catch(er => {
            res.status(500).json({
                error: er
            })
        });

});

//------------- add new manager  -----------
router.post('/signup', (req, res, next) => {

    User.find({email: req.body.email})
        .exec()
        .then(user => {
            if(user.length > 0){
                return res.status(500).json({
                    message: 'Already registered, try another email address'
                });
            }else{
                bcrypt.hash(req.body.password, 10, function(err, hash) {
                    // Store hash in your password DB.
                    if(err){
                        return res.status(500).json({
                            error: err
                        });
                    }else{
                        const manager = new User({
                            _id: new mongoose.Types.ObjectId(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            email: req.body.email,
                            isManager:true,
                            password: hash,
                            createdAt: new Date().toISOString()
                        });

                        const message = {
                            from: 'fashionhouse@fsh.com', // Sender address
                            to: req.body.email,         // List of recipients
                            subject: 'Manager Access-FashionStore', // Subject line
                            //text: 'Message body in text' // Plain text body
                            html: '<h1>FashionHouse Manager Access</h1>' +
                                '<p>Hi '+req.body.firstName+',</p>'+
                                '<p>You have been already assigned as a manager in FashionHouse.Start your work from now onwards.Your login credentials are</p>' +
                                '<p>Email : <b>'+req.body.email+'</b></p><p>Password :<b> '+req.body.password+'</b></p>'+
                                '<p>Thank You</p>'+
                                '<p>System Admin</p>'
                        };

                        manager.save()
                            .then(doc => {
                                res.status(201).json({
                                    message: 'Manager Registered Successfully'
                                });
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });
                            })
                            .catch(er => {
                                res.status(500).json({
                                    error: er
                                });
                            });
                    }
                });
            }
        })

});

//--------------- remove manager -------------------------
router.delete('/delete/:id', function (req, res) {
    let id = req.params.id;

    User.findById(req.params.id).then(emp => {
        emp.remove();
        res.send('Manager removed');
    }).catch(err =>{
        res.send(err)
    })
});

module.exports = router;
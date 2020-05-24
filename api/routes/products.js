const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const Category = require('../models/category');
const authenticate = require('../middleware/authenticate');

//-----------------Add a product----------------------
router.post('/create', authenticate, (req, res, next) => {

    const slug = req.body.name.replace(/ /g, '-') +'-'+ Date.now();

    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        slug: slug,
        price: req.body.price,
        stock: req.body.stock,
        description: req.body.description,
        productPic: req.body.productPic,
        keyword: req.body.keyword,
        category: req.body.category,
        createdBy: req.body.createdBy
    });

    product.save()
        .then(product => {
            res.status(201).json({
                message: product
            });
        })
        .catch(er => {
            res.status(500).json({
                error: er
            });
        })

});

//-----------------Get all products-----------------
router.get('/', (req, res, next) => {

    Product.find({})
        .select('_id name price productPic slug stock offer createdAt rating')
        .exec()
        .then(products => {
            res.status(200).json({
                message: products
            });
        })
        .catch(er => {
            res.status(500).json({
                error: er
            });
        })

});

//-----------------Get products by category--------------------
router.get('/:categorySlug', (req, res, next) => {

    let filter = {};
    if(req.query.hasOwnProperty("filter")){
        filter['price'] = req.query.price
    }

    const slug = req.params.categorySlug;

    Category.findOne({slug: slug})
        .select('_id parent')
        .exec()
        .then(category => {
            if(category){

                if(category.parent === ""){
                    Category.find({"parent": category._id})
                        .select('_id name')
                        .exec()
                        .then(categories => {
                            const categoriesAr = categories.map(category => category._id);
                            Product.find({ "category": { $in: categoriesAr } })
                                .select('_id name price productPic category slug rating')
                                .sort(filter)
                                .exec()
                                .then(products => {
                                    res.status(200).json({
                                        message: products
                                    })
                                })
                                .catch(error => {
                                    res.status(500).json({
                                        error: error
                                    })
                                })


                        })
                        .catch(error => {

                        })

                }else{
                    Product.find({category: category._id})
                        .select('_id name price productPic category slug rating')
                        .sort(filter)
                        .exec()
                        .then(products => {
                            res.status(200).json({
                                message: products
                            })
                        })
                        .catch(error => {
                            return res.status(404).json({
                                message: error
                            })
                        })
                }



            }else{
                return res.status(404).json({
                    message: 'Not Found'
                })
            }
        })
        .catch(er => {
            res.status(500).json({
                error: er
            });
        });
});

//----------------Get a Product---------------------
router.get('/:categorySlug/:productSlug', (req, res, next) => {

    const productSlug = req.params.productSlug;

    Product.findOne({slug: productSlug})
        .exec()
        .then(product => {
            if(product){
                res.status(200).json({
                    message: product
                });
            }else{
                return res.status(404).json({
                    message: 'Not Found'
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });


});

//------------------Add discounts to a Product---------------------
router.put('/update/offer',(req,res,next) =>{

    const productId = req.body._id;
    const offer = req.body.offer;

    /*Product.update({"product":productId}, {
        $set: {
            "product.$.offer": offer
        }
    })
        .exec()
        .then(product => {
            res.status(201).json({
                message: product
            });
        })
        .catch(error => {
            res.status(500).json({
                error: error
            });
        });*/

    console.log(offer);
    Product.findByIdAndUpdate(productId, { offer: offer})
        .exec()
        .then(product => {
            res.status(201).json({
                message: 'Discount added'
            });
        })
        .catch(error => {
            res.status(500).json({
                error:error
            });
        });

});

//------------------Add review to a Product----------------------
router.put('/addReview', authenticate, (req, res, next) => {

    const review = {
        _id: new mongoose.Types.ObjectId(),
        userId:req.body.userId,
        name:req.body.name,
        rating:req.body.rating,
        review: req.body.review,
        createdAt: new Date().toISOString()
    }

    const productId = req.body.productId;

   Product.findByIdAndUpdate(productId,{ $push:{reviews:review}})
       .exec()
       .then(product => {
           res.status(201).json({
               message: 'Review added'
           });
        })
       .catch(error => {
           res.status(500).json({
               error:error
           });
       });

    Product.findById(productId)
        .select('reviews.rating')
        .exec()
        .then(reviews => {
            let total = 0;
            for(let i = 0; i < reviews.reviews.length;i++){
                total = total +reviews.reviews[i].rating;
            }
            let avg = total/reviews.reviews.length;

            Product.findByIdAndUpdate(productId,{ $set:{rating:avg}})
                .exec()
                .then(product => {

                })

        })
        .catch(error => {
            console.log(error)
        });

});

//-----------------Delete a Product-----------------------
router.delete('/delete/:id', function (req, res) {
    let id = req.params.id;

    Product.findById(req.params.id).then(emp => {
        emp.remove();
        res.send('Product removed');
    }).catch(err =>{
        res.send(err)
    })
});



module.exports = router;
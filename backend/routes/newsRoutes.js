const express = require("express");
const News = require("../models/News");

const {protect, admin} = require("../middleware/authMiddleware");
const router = express.Router();

 const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize("NFD") // Tách dấu ra khỏi chữ
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/đ/g, "d").replace(/Đ/g, "D") // Đổi chữ đ
    .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, "-"); // Xóa các dấu gạch ngang thừa liên tiếp
};

// lay tat ca tin tuc 
// Get / api / news 
router.get("/", async (req, res) =>{
    try {
        const news = await News.find({}).populate("user","name email").sort({createdAt: -1})
        res.json(news)
    }catch (error){
        res.status(500).json({message: "Loi server"})
    }
})


// lay tung tin tuc theo slug 
// get / api / news/ :slug 
router.get("/:slug", async (req,res)=> {
    try{
        const news = await News.findOne({slug : req.params.slug})
        if(news){
            res.json(news)
        }else{
            res.status(404).json({message: "Tin tuc khong tim thay"})
        }

    }catch(error){
        console.error(error)
        res.status(500).json({message: "Loi server"})
    }
})


// tao bai viet moi 
// post / api/ news 

router.post("/", protect , admin , async(req, res)=>{
   

try {
    const {title , intro , content , imageUrl } = req.body

    if(!title || !intro || !content || !imageUrl){
        return res.status(400).json({message: "Vui long dien day du thong tin"})
    }
    const slug = generateSlug(title)

    const existingNews = await News.findOne({slug})
    if(existingNews){
        return res.status(400).json({message: "Da ton tai bai viet voi tieu de nay"})
    }

    const news = new News({
        title, 
        slug,
        intro , 
        content , 
        imageUrl, 
        user : req.user._id
    })

    const createNews = await news.save()
    res.status(201).json(createNews)

}catch(error){
    console.error(error)
    res.status(500).json({message: "Loi server"})
}
})


// chinh sua bai viet
// put / api / news / :id 
router.put("/:id" , protect , admin , async(req, res)=>{

    try {   
        const {title, intro , content , imageUrl} = req.body
            const news = await News.findById(req.params.id)
            if(news ){
                if(title && news.title !== title){
                    news.slug = generateSlug(title)
                }
                news.title = title || news.title 
                news.intro = intro || news.intro
                news.content = content || news.content 
                news.imageUrl = imageUrl || news.imageUrl
                const updatedNews = await news.save()
                res.json(updatedNews)
            }else{
                res.status(404).json({message: "Tin tuc khong tim thay"})
            }

    }   catch(error){
        console.error(error)
        res.status(500).json({message: "Loi server"})
    }
})



// xoa bai viet 
// delete / api / news/ :id 
router.delete("/:id", protect , admin , async(req, res)=>{
    try {
        const news = await News.findById(req.params.id)
        if (news) {
      // Dùng deleteOne() cho các bản Mongoose mới
      await news.deleteOne(); 
      res.json({ message: "Đã xóa bài viết thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy bài viết để xóa" });
    }
    }catch(error){
        console.error(error)
        res.status(500).json({message: "Loi server"})
    }
});

module.exports = router
import { MdDeleteForever } from "react-icons/md";
import { useDispatch } from "react-redux";
import { updateCartItemQuantity } from '@redux/slices/cartSlice';
import { deleteCartItem } from "@redux/slices/cartSlice";
function CartContent({cart , userId , guestId}) {
 const dispatch = useDispatch()
 const handleAddToCart = (productId , delta , quantity, size , color , )=>{
  const newQuantity = quantity + delta
if(newQuantity > 0){
dispatch(updateCartItemQuantity({
  productId,
  quantity : newQuantity , 
userId , 
guestId,
size , 
color 
}))
}
 }

const handleRemoveCart = (productId , size , color  )=>{
dispatch(deleteCartItem({
  productId, size, color , userId , guestId

}))
}

  return (
    <div>
      {cart.products.map((product, index) => {
        return (
          <div
            key={index}
            className=" flex items-start justify-between py-4 border-b ">
            <div className=" flex items-start ">
              <img
                src={product.image}
                alt={product.name}
                className=" w-20 h-24 object-cover mr-4 rounded "
              />
              <div>
                <h3> {product.name} </h3>
                <p className="text-sm text-gray-500 ">
                  size: {product.size} | color: {product.color}
                </p>
                <div className="flex items-center mt-2"> 

                <button className=" border rounded px-2 py-1 text-xl font-medium 
                 hover:bg-gray-100 transition-all duration-300 ease-in-out border-none "
                 onClick={()=> handleAddToCart(product.productId, -1 , product.quantity, product.size, product.color)}

                 >-</button>
               <span className="mx-4 ">{product.quantity} </span>
                <button className="border rounded px-2 py-1 text-xl font-medium
                 hover:bg-gray-100 transition-all duration-300 ease-in-out border-none "
                 onClick={()=> handleAddToCart(product.productId , 1 , product.quantity, product.size, product.color )}
                 >+</button>
                 </div>

              </div>
            </div>
            <div> 
                <p>${product.price.toLocaleString()} </p>
                <button 
                onClick={()=> handleRemoveCart(product.productId, product.size, product.color)}
                >
                <MdDeleteForever className="h-6 w-6 mt-2 text-red-600 " />
                </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CartContent;

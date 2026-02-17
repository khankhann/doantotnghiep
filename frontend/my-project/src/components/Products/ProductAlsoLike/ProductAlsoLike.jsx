import ProductsGrid from "@components/Products/ProductsGrid/ProductsGrid";
function ProductAlsoLike({products , loading , error}) {
  if(loading){
    return <p>Loading... </p>
  }else if(error){
    return <p>Error : {error}... </p>
  }

  return (
    <section className="mt-20">
      <h2 className="text-2xl text-center font-medium mb-4">
        You May Also Like
      </h2>
     <ProductsGrid products = {products} loading = {loading} error = {error}/>
    </section>
  );
}

export default ProductAlsoLike;

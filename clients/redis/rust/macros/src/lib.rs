use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, Type};

#[proc_macro_attribute]
pub fn serialization(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as DeriveInput);

    if let Data::Struct(ref mut data) = input.data {
        if let Fields::Named(ref mut fields) = data.fields {
            for field in fields.named.iter_mut() {
                if is_option(&field.ty) {
                    field
                        .attrs
                        .push(syn::parse_quote!(#[serde(skip_serializing_if = "Option::is_none")]));
                }
            }
        }
    }

    let name = &input.ident;
    let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

    let expanded = quote! {
        #[derive(::memorix_client_redis::__private::serde::Serialize, ::memorix_client_redis::__private::serde::Deserialize)]
        #[serde(crate = "::memorix_client_redis::__private::serde")]
        #input

        impl #impl_generics #name #ty_generics #where_clause {
            pub fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: ::memorix_client_redis::__private::serde::Serializer,
            {
                ::memorix_client_redis::__private::serde::Serialize::serialize(self, serializer)
            }

            pub fn deserialize<'de, D>(deserializer: D) -> Result<Self, D::Error>
            where
                D: ::memorix_client_redis::__private::serde::Deserializer<'de>,
            {
                ::memorix_client_redis::__private::serde::Deserialize::deserialize(deserializer)
            }
        }
    };

    TokenStream::from(expanded)
}

fn is_option(ty: &Type) -> bool {
    if let Type::Path(type_path) = ty {
        if let Some(segment) = type_path.path.segments.last() {
            return segment.ident == "Option";
        }
    }
    false
}

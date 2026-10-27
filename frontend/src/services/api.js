import axios from "axios";


// =====================================================
// BACKEND API
// =====================================================

const api = axios.create({

    baseURL:
        "http://127.0.0.1:5000/api",

    timeout:
        15000,

    headers: {

        Accept:
            "application/json"

    }

});


// =====================================================
// RESPONSE ERROR LOGGING
// =====================================================

api.interceptors.response.use(

    response => response,

    error => {

        console.error(
            "API request failed:",
            {
                method:
                    error.config?.method,

                url:
                    error.config?.url,

                baseURL:
                    error.config?.baseURL,

                status:
                    error.response?.status,

                response:
                    error.response?.data,

                message:
                    error.message
            }
        );


        return Promise.reject(error);

    }

);


export default api;
//importamos el contexto de autorización
import { AuthContext } from '../contexts/AuthContext';

//importamos hooks
import { useContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

//importamos dependencias
import toast from 'react-hot-toast';

//importamos la variables de entorno
const { VITE_API_URL } = import.meta.env;

//Iniciamos componente
const RatingPage = () => {
    //obtenemos el token de autorización
    const { authToken, authUser, authLoading } = useContext(AuthContext);

    //obtenemos navigate
    const navigate = useNavigate();

    //declaramos una variable en el State para almacenar cada input
    const [title, setTitle] = useState('');
    const [rate, setRate] = useState('');
    const [comment, setComment] = useState('');

    //declaramos la variable para almacenar el fetch
    const [loading, setLoading] = useState(false);

    //función que maneja el envío del evento
    const handleRating = async (e) => {
        try {
            //prevenimos el comportamiento por defecto del formulario
            e.preventDefault();

            //indicamos que da comienzo el fetch
            setLoading(true);

            //Obtenemos la respuesta
            const res = await fetch(`${VITE_API_URL}/api/users/ratings`, {
                method: 'POST',
                headers: {
                    Authorization: authToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    rate: Number(rate),
                    comment,
                }),
            });

            //obtenemos el body
            const body = await res.json();

            //si hay algún error lo lanzamos
            if (body.status === 'error') {
                throw new Error(body.message);
            }
            //si todo va bien
            toast.success(body.message, {
                id: 'rating',
                duration: 5000,
            });

            //redirigimos al home
            navigate('/');
        } catch (err) {
            toast.error(err.message, { id: 'rating', duration: 5000 });
        } finally {
            setLoading(false);
        }
    };
    // Esperamos a que se cargue el estado de autenticación
    if (authLoading && authToken) {
        return <div>Loading...</div>;
    }
    //console.log('Auth State:', { authUser, authToken }); // debugging
    //si no estamos logueados, redirigimos a la pagina principal
    if (!authUser || !authToken) {
        return <Navigate to='/login' />;
    }
    return (
        <main className='bg-[#E5F7FF] flex flex-col items-center justify-center min-h-screen p-4'>
            <section className='bg-white p-8 rounded-lg shadow-md w-full max-w-xs mx-auto'>
                <h2 className='text-2xl font-bold text-[#083059] text-center mb-6'>
                    Déjanos un comentario!
                </h2>
                <p className='text-gray-600 text-center mb-8'>
                    Ayúdanos a mejorar nuestra plataforma para poder llevarte
                    cada día más lejos al mejor precio.
                </p>
                <form onSubmit={handleRating} className='space-y-6'>
                    <div>
                        <label
                            htmlFor='title'
                            className='block text-[#083059] font-medium mb-2'
                        >
                            Título:
                        </label>
                        <input
                            type='text'
                            id='title'
                            className='w-full p-3 border border-[#3951AA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#179DD9]'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='rate'
                            className='block text-[#083059] font-medium mb-2'
                        >
                            Valoración:
                        </label>
                        <select
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        >
                            <option value=''>Valoración</option>
                            <option value='1'>⭐</option>
                            <option value='2'>⭐⭐</option>
                            <option value='3'>⭐⭐⭐</option>
                            <option value='4'>⭐⭐⭐⭐</option>
                            <option value='5'>⭐⭐⭐⭐⭐</option>
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor='comment'
                            className='block text-[#083059] font-medium mb-2'
                        >
                            Descripción:
                        </label>
                        <textarea
                            name='comment'
                            id='comment'
                            className='w-full p-3 border border-[#3951AA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#179DD9] min-h-[100px]'
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        >
                            Déjanos tu comentario
                        </textarea>

                        <button
                            disabled={loading}
                            className='w-full bg-[#179DD9] text-white py-3 px-4 rounded-md hover:bg-[#3951AA] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Enviando...' : 'Enviar valoración'}
                        </button>
                    </div>
                </form>
            </section>
            <section>
                {/*Listado de valoraciones de más reciente a menos */}
            </section>
        </main>
    );
};

export default RatingPage;

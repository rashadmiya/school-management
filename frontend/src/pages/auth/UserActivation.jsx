import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { server } from '@/utils/server';

const UserActivation = () => {
    const { token } = useParams(); // from /activation/:token
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const activateUser = async () => {
            try {
                const response = await axios.post(`${server}/user/activation`, {
                    activation_token: token,
                });

                setStatus('success');
                setMessage(response.data.message || 'Account activated successfully!');

                // Optional: store token in localStorage or context
                // localStorage.setItem('token', response.data.token);

                // Redirect after short delay
                setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage(
                    error.response?.data?.message || 'Activation failed. Please try again or contact support.'
                );
            }
        };

        if (token) activateUser();
        else {
            setStatus('error');
            setMessage('No activation token found.');
        }
    }, [token, navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'loading' && <p style={styles.loading}>Activating your account...</p>}

                {status === 'success' && (
                    <>
                        <h2 style={styles.title}>🎉 Activation Successful</h2>
                        <p style={styles.message}>{message}</p>
                        <p style={styles.redirect}>Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 style={styles.title}>❌ Activation Failed</h2>
                        <p style={styles.message}>{message}</p>
                        <button onClick={() => navigate("/dashboard")} style={styles.button}>
                            Go Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserActivation;

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
    },
    card: {
        backgroundColor: '#fff',
        padding: '2rem 3rem',
        borderRadius: '12px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        textAlign: 'center',
    },
    title: {
        color: '#4caf50',
        fontSize: '24px',
        marginBottom: '1rem',
    },
    message: {
        fontSize: '16px',
        marginBottom: '1rem',
    },
    loading: {
        fontSize: '18px',
        color: '#666',
    },
    redirect: {
        fontSize: '14px',
        color: '#888',
    },
    button: {
        backgroundColor: '#4caf50',
        color: '#fff',
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};

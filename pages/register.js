import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validatePassword = (pwd) => {
    return pwd.length === 4 && /^\d+$/.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[50vh] w-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 flex items-center justify-center overflow-hidden">
      {/* Full Screen Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-center"
        style={{ minHeight: "50vh" }}
      >
        {/* Left Section - Hero (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex flex-col justify-center w-1/2 px-12"
        >
          <div className="mb-4 inline-block">
            <span className="text-6xl">🐑</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Farm Health <span className="text-green-600">System</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Join our community of farm managers and optimize your livestock management with our comprehensive system.
          </p>
          <div className="flex flex-col gap-4">
            <p className="text-gray-700 font-semibold flex items-center gap-3">
              ✓ <span>Complete health records tracking</span>
            </p>
            <p className="text-gray-700 font-semibold flex items-center gap-3">
              ✓ <span>Inventory management</span>
            </p>
            <p className="text-gray-700 font-semibold flex items-center gap-3">
              ✓ <span>Role-based access control</span>
            </p>
            <p className="text-gray-700 font-semibold flex items-center gap-3">
              ✓ <span>Real-time farm operations</span>
            </p>
          </div>
        </motion.div>

        {/* Right Section - Register Form (Centered on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6"
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="p-6 md:p-10">
              {/* Logo Section */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl mx-auto mb-3"
              >
                <span className="text-xl">🐑</span>
              </motion.div>

              {success ? (
                // Success State
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6"
                  >
                    <FaCheckCircle className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">Account Created! 🎉</h1>
                  <p className="text-gray-600 mb-8 font-medium">
                    Your account has been successfully created. Redirecting to login...
                  </p>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-green-600 font-bold text-lg"
                  >
                    ⏳ Redirecting in 2 seconds...
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-4"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
                    <p className="text-xs text-gray-600 font-medium">
                      Join the Farm Health Management System
                    </p>
                  </motion.div>

                  {/* Error Alert */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Full Name */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-green-600" size={13} />
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all font-medium text-xs"
                      />
                    </motion.div>

                    {/* Email */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <FaEnvelope className="text-green-600" size={13} />
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all font-medium text-xs"
                      />
                    </motion.div>

                    {/* PIN */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <FaLock className="text-green-600" size={13} />
                        Password (4 Digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData(prev => ({ ...prev, password: value }));
                          setError('');
                        }}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all text-center text-lg tracking-widest font-bold"
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        💡 4-digit PIN
                      </p>
                    </motion.div>

                    {/* Confirm PIN */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <FaLock className="text-green-600" size={16} />
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData(prev => ({ ...prev, confirmPassword: value }));
                          setError('');
                        }}
                        placeholder="••••"
                        maxLength="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-center text-2xl tracking-widest font-bold"
                      />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-2 rounded-lg font-bold text-white text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl"
                      }`}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin" size={12} />
                          Creating Account...
                        </>
                      ) : (
                        "✓ Create Account"
                      )}
                    </motion.button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500 font-medium text-xs">or</span>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <p className="text-center text-xs text-gray-600 font-medium">
                    Already have an account?{' '}
                    <Link href="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline transition">
                      Sign in here
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Specify layout for this page
Register.layoutType = 'auth';
Register.layoutProps = { title: 'Create Account' };

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Login - {{ config('app.name', 'HRMIS') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
<style>
        /* Setting a default font for aesthetics */
        body {
            font-family: 'Inter', sans-serif;
        }

        /* Custom dark blue for the button/logo background, approximating the image */
        .btn-primary {
            background-color: #2f486e; /* Deep Navy Blue */
            transition: background-color 0.2s;
        }
        .btn-primary:hover {
            background-color: #3b5f8c;
        }
    </style>
    <script>
        // Customizing Tailwind to easily use the primary brand color
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'primary-dark': '#2f486e', /* Deep Navy Blue */
                        'bg-light': '#f5f7f9', /* Light background color for the right panel */
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-bg-light min-h-screen">

    <main class="flex min-h-screen">
        <!-- LEFT PANEL: Image Background (Hidden on Mobile, Visible on Tablet/Desktop) -->
        <div class="hidden md:block md:w-1/2 relative">
            <!-- Background Image with Overlay -->
            <!-- Using an Unsplash URL with a fallback placeholder -->
            <img 
                src="https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                onerror="this.onerror=null; this.src='https://placehold.co/1920x1080/0d0d0d/8d8d8d?text=Team+Collaboration';"
                alt="A team of people working in a shared office space." 
                class="w-full h-full object-cover"
            >
            <!-- Dark Overlay to match the mood of the original image -->
            <div class="absolute inset-0 bg-black opacity-40"></div>
            <!-- Small 'N' logo placeholder at the bottom left, mimicking the original image -->
            <div class="absolute bottom-4 left-4 text-white text-lg font-bold p-1 rounded-sm border border-white">N</div>
        </div>

        <!-- RIGHT PANEL: Login Form -->
        <div class="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
            <div class="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-gray-100">

                <!-- Logo and Title Section -->
                <div class="flex flex-col items-center mb-10">
                    <div class="flex flex-col items-center space-x-3 text-primary-dark">
                        <!-- Icon Placeholder (Briefcase SVG to represent HR/Business) -->
                        {{-- <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10l-8-4m8 4l8-4m-8 4l-8 4"></path>
                        </svg> --}}
                        <img src="{{asset('img/logo.png')}}" alt="">

                        <h1 class="text-3xl font-extrabold tracking-tight">HRMIS</h1>
                    </div>
                    <p class="mt-5 text-gray-600 text-center text-lg">Login to your account</p>
                </div>

                <!-- Login Form -->
                <!-- The form uses JavaScript to intercept submission and show a message box -->
                <form onsubmit="event.preventDefault(); showMessage();">
                    <!-- Email Input -->
                    <div class="mb-5">
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            placeholder="m@example.com"
                            required
                            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-dark focus:border-primary-dark sm:text-sm transition duration-150 ease-in-out"
                        >
                    </div>

                    <!-- Password Input with Forgot Link -->
                    <div class="mb-8">
                        <div class="flex justify-between items-baseline mb-1">
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                        </div>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="••••••••"
                            required
                            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-dark focus:border-primary-dark sm:text-sm transition duration-150 ease-in-out"
                        >
                        <a href="#" class="text-sm font-medium text-primary-dark hover:text-blue-600 transition duration-150 ease-in-out">Forgot your password?</a>
                    </div>

                    <!-- Submit Button -->
                    <div>
                        <button 
                            type="submit" 
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition duration-150 ease-in-out"
                        >
                            Login
                        </button>
                    </div>
                </form>

                <!-- Signup Link -->
                <div class="mt-8 text-center text-base text-gray-600">
                    Don't have an account? 
                    <a href="#" class="font-semibold text-primary-dark hover:text-blue-600 transition duration-150 ease-in-out">Sign up</a>
                </div>
            </div>

            <!-- Custom Message Box for non-functional login (to avoid using alert()) -->
            <div id="messageBox" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center p-4 z-50" onclick="closeMessage()">
                <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full" onclick="event.stopPropagation()">
                    <h3 class="text-xl font-bold mb-3 text-primary-dark">Login Attempt</h3>
                    <p class="text-gray-700 mb-4">This is a static demo. You clicked the login button, but no actual authentication occurred.</p>
                    <button onclick="closeMessage()" class="w-full py-2 px-4 rounded-lg bg-primary-dark text-white hover:bg-[#3b5f8c] transition">Close</button>
                </div>
            </div>

        </div>
    </main>

    <script>
        // Simple function to display the message box instead of alert()
        function showMessage() {
            document.getElementById('messageBox').classList.remove('hidden');
            document.getElementById('messageBox').classList.add('flex');
        }

        function closeMessage() {
            document.getElementById('messageBox').classList.add('hidden');
            document.getElementById('messageBox').classList.remove('flex');
        }
    </script>
</body>
</html>
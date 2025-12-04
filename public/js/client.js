//Client-side Input Validation

document.addEventListener('DOMContentLoaded', () => {
    
    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|;:'",.<>/?\\~`]).{8,}$/;
    const PASSWORD_REQUIREMENTS_MESSAGE = 'Password must be at least 8 characters long and contain: one lowercase letter, one uppercase letter, one number, and one special character.';

    const validateString = (str, varName) => {
        if (!str || typeof str !== 'string' || str.trim().length === 0) {
            return `${varName} is required and cannot be empty.`;
        }
        return null;
    };

    const displayError = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    };
    
    const validateCredentials = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return true; //Form not present, nothing to validate

        let usernameInput = document.getElementById('username');
        let passwordInput = document.getElementById('password');
        
        let isValid = true;

        //Clear previous errors
        displayError('username-error', null);
        displayError('password-error', null);
        
        //Username Validation
        let usernameError = validateString(usernameInput.value, 'Username');
        if (usernameError) {
            displayError('username-error', usernameError);
            isValid = false;
        } else if (usernameInput.value.length < 4) {
            displayError('username-error', 'Username must be at least 4 characters long.');
            isValid = false;
        } else if (usernameInput.value.includes(' ')) {
            displayError('username-error', 'Username cannot contain spaces.');
            isValid = false;
        }
        
        //Password Validation
        let passwordError = validateString(passwordInput.value, 'Password');
        if (passwordError) {
            displayError('password-error', passwordError);
            isValid = false;
        } else if (!STRONG_PASSWORD_REGEX.test(passwordInput.value)) {
            displayError('password-error', PASSWORD_REQUIREMENTS_MESSAGE);
            isValid = false;
        }

        return isValid;
    };
    
    const validateSignupForm = () => {
        let credentialsValid = validateCredentials('signup-form');
        let firstNameInput = document.getElementById('firstName');
        let lastNameInput = document.getElementById('lastName');

        let isValid = credentialsValid;
        
        //First Name Validation
        displayError('firstName-error', null); 
        let firstNameError = validateString(firstNameInput.value, 'First Name');
        if (firstNameError) {
            displayError('firstName-error', firstNameError);
            isValid = false;
        }

        //Last Name Validation
        displayError('lastName-error', null);
        let lastNameError = validateString(lastNameInput.value, 'Last Name');
        if (lastNameError) {
            displayError('lastName-error', lastNameError);
            isValid = false;
        }

        return isValid;
    };

    //FORM SUBMISSION HANDLERS
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            if (!validateCredentials('login-form')) {
                event.preventDefault(); //Stop form submission if client-side validation fails
                //Using a simple alert for now. Replace with a UI message later.
                console.error("Client-side validation failed for login."); 
            }
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        //Find existing error spans (for first/last name) or create them dynamically if needed
        //Assuming they were added to views/signup.handlebars in the first step
        
        signupForm.addEventListener('submit', (event) => {
            if (!validateSignupForm()) {
                event.preventDefault(); //Stop form submission if client-side validation fails
                //Using a simple alert for now. Replace with a UI message later.
                console.error("Client-side validation failed for signup.");
            }
        });
    }
});
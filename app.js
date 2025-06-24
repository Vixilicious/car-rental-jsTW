const BASE_URL = "http://localhost:8080/api/v1";

function navigateTo(sectionId) {
  const sections = document.querySelectorAll(".page-section"); // Fixed class selector
  sections.forEach((section) => section.classList.remove("active"));

  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add("active");

    if (sectionId === "cars-section") {
      return fetchCars();
    } else if (sectionId === "booking-section") {
      bookingHandler();
    }
    // else {
    //   const defaultSection = document.getElementById("home-section");
    //   if (defaultSection) {
    //     defaultSection.classList.add("active");
    //   }
    // }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  navLinkLoginStatus();
  const navLinks = document.querySelectorAll(".page-link");

  // Navigation click logic

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const targetPage = `${link.getAttribute("data-page")}-section`; // Append '-section' for correct section ID
      navigateTo(targetPage);

      navLinkLoginStatus();

      navLinks.forEach((nav) => nav.classList.remove("active"));
      link.classList.add("active");
    });
  });
});

// Function to handle login

async function loginHandler() {
  console.log("loginHandler called");
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const resultElement = document.getElementById("login-result");

  if (!username || !password) {
    resultElement.innerHTML =
      '<span class="error">Please enter both username and password</span>';
    return;
  }

  try {
    resultElement.innerHTML =
      '<span style="color: green;">Logging in...</span>';

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    // Store user details in sessionStorage
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("username", username);
    // sessionStorage.setItem("userId", data.userId); // Store userId
    sessionStorage.setItem("isAdmin", data.isAdmin);
    navLinkLoginStatus();

    setTimeout(() => {
      const redirect = localStorage.getItem("postLoginRedirect");
      if (
        redirect === "booking-section" &&
        localStorage.getItem("selectedCar")
      ) {
        localStorage.removeItem("postLoginRedirect");
        navigateTo("booking-section");
      } else {
        navigateTo("home-section");
        // resultElement.textContent = "";
      }
    }, 1000);
  } catch (error) {
    console.error("Error during login:", error);
    resultElement.innerHTML = `<span class="error">Login failed: ${error.message}</span>`;
  }
}

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginHandler();
});

// Function to handle logout

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("username");
  navLinkLoginStatus();
  navigateTo("home-section");
  console.log("User logged out");
});

// Navigation link switch based on login status

function navLinkLoginStatus() {
  const isLoggedIn = !!sessionStorage.getItem("username");
  const myPagesNav = document.getElementById("my-pages-nav-item");
  const loginNav = document.getElementById("login-nav-item");
  const logoutNav = document.getElementById("logout-btn");
  const rentLoginCheck = document.getElementById("login-check");

  if (isLoggedIn) {
    myPagesNav?.classList.remove("hidden");
    loginNav?.classList.add("hidden");
    logoutNav?.classList.remove("hidden");
    rentLoginCheck?.classList.add("hidden"); //TODO: Use hide/show elements
  } else {
    myPagesNav?.classList.add("hidden");
    loginNav?.classList.remove("hidden");
    logoutNav?.classList.add("hidden");
  }
}

function showElement(element) {
  // console.log(element);
  //TODO: Use hide/show elements (rent button message login)
  if (!element) return;
  const isHidden = element.classList.contains("hidden");
  if (isHidden) element.classList.remove("hidden");
}

function hideElement(element) {
  if (!element) return;
  const isHidden = element.classList.contains("hidden");
  if (!isHidden) element.classList.add("hidden");
}

async function handleRegistration() {
  // Get form values
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const username = document.getElementById("username-register").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password-register").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const alertBox = document.getElementById("registration-alert");

  if (
    !firstName ||
    !lastName ||
    !username ||
    !email ||
    !phone ||
    !password ||
    !confirmPassword
  ) {
    alertBox.innerHTML =
      '<div class="alert alert-danger">Please fill in all fields.</div>';
    return;
  }
  if (password !== confirmPassword) {
    alertBox.innerHTML = `<span style="color: red;">Passwords do not match</span>`;
    return;
  }

  const registerBtn = document.getElementById("register-button");
  if (registerBtn) {
    registerBtn.disabled = true;
    registerBtn.textContent = "Creating Account...";
  }

  try {
    const userData = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      phone: phone,
      password: password,
      role: "ROLE_USER", // Default role for new users
      noOfOrders: 0, // Default value for new users
    };

    console.log("userData:", userData);

    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    console.log("Registration response status:", response.status);

    if (response.ok) {
      alertBox.innerHTML = `<span style="color: green;">Registration successful! You can now log in.</span>`;
      setTimeout(() => {
        navigateTo("login-section");
      }, 2000); // Redirect to login after 2 seconds
      document.getElementById("registration-form").reset(); // Reset the form
    } else {
      const errorData = await response.text();
      alertBox.innerHTML = `<span style="color: red;">Registration failed: ${errorData.message}</span>`;
    }
  } catch (error) {
    alertBox.innerHTML = `<span style="color: red;">Registration failed. Please try again.</span>`;
  }
  registerBtn.disabled = false; // Re-enable the button
  registerBtn.textContent = "Create account"; // Reset button text
}

document
  .getElementById("registration-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    handleRegistration();
  });

// Function fetch CARS

let allCars = []; // Global variable to store all cars and filter them later
let currentSort = "none";
let currentSearch = ""; // Global variable to display filtered cars

async function fetchCars() {
  const carContainer = document.getElementById("car-container");
  // const searchInput = document.getElementById("search-input");
  carContainer.innerHTML = "Loading cars...";

  try {
    const response = await fetch(`${BASE_URL}/cars`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok)
      throw new Error(`Error fetching cars: ${response.status}`);

    allCars = await response.json();
    displayCars(allCars);
    //
  } catch (error) {
    console.error("Error fetching cars:", error);
    carContainer.innerHTML = `<span style="color: red;">Error fetching cars: ${error.message}</span>`;
  }
}

// Function to display CARS

function displayCars(cars) {
  const carContainer = document.getElementById("car-container");
  carContainer.innerHTML = ""; // Clear previous content

  if (!cars.length) {
    carContainer.innerHTML = "<p>No cars available.</p>";
    return;
  }
  carContainer.innerHTML = cars
    .map(
      (car) =>
        `
      <div class="car-card">
        <img class="car-image" src="${
          car.image ? `data:image/jpeg;base64,${car.image}` : car.imageUrl
        }" alt="${car.name}"/>
        <div class="car-info">
          <p class="car-name">${car.name}</p>
          <p class="car-model">${car.model}</p>
          <div class="car-features-container">
          <p> Features: </p>
          <div class="car-features">
          <p class="car-feature feature-1">${car.feature1 || ""}</p>
          <p class="car-feature feature-2">${car.feature2 || ""}</p>
          <p class="car-feature feature-3">${car.feature3 || ""}</p>
          </div>
          </div>
          <div class="car-bottom-row">
            <p class="car-price">SEK ${car.price}/day</p>
            <button class="rent-button" onclick="handleRentCar(${
              car.id
            })">Rent Now</button>
          </div>
        </div>
        <div class="message-container" id="msg-${car.id}"></div>
      </div>
      `
    )
    .join("");
}

// Function search filter for CARS

document.getElementById("search-input").addEventListener("input", function () {
  currentSearch = this.value.trim().toLowerCase();
  displayFilteredCars();
});

document.getElementById("sort-select").addEventListener("input", function () {
  currentSort = this.value.trim().toLowerCase();
  displayFilteredCars();
});

document.getElementById("clear-filters").addEventListener("click", (e) => {
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = "none";

  currentSearch = "";
  currentSort = "none";

  displayCars(allCars);
});

function displayFilteredCars() {
  let filteredCars = allCars.filter(
    (car) =>
      (car.name && car.name.toLowerCase().includes(currentSearch)) ||
      (car.model && car.model.toLowerCase().includes(currentSearch))
  );
  if (currentSort === "price") {
    filteredCars = [...filteredCars].sort((a, b) => a.price - b.price);
  } else if (currentSort === "name") {
    filteredCars = [...filteredCars].sort((a, b) => {
      return (a.name + a.model).localeCompare(b.name + b.model);
    });
  }
  displayCars(filteredCars);
}

function handleRentCar(carId) {
  let selectedCar = allCars.find((car) => car.id === carId);
  // let carContainer = document.getElementById("car-container");
  let rentError = document.getElementById("login-check");

  console.log("rentError element:", rentError);

  // const messageContainer = document.getElementById(`msg-${carId}`);

  const isLoggedIn = !!sessionStorage.getItem("username");

  if (!isLoggedIn) {
    showElement(rentError);
    // Store car-info so after login we know which car to book
    localStorage.setItem("selectedCar", JSON.stringify(selectedCar));
    localStorage.setItem("postLoginRedirect", "booking-section");
  } else {
    hideElement(rentError);
    localStorage.setItem("selectedCar", JSON.stringify(selectedCar));
    navigateTo("booking-section");
    console.log();
  }
}

function bookingHandler() {
  // Add this right before your booking fetch call
  const carData = localStorage.getItem("selectedCar");
  const container = document.getElementById("selected-car-container");

  if (carData) {
    const car = JSON.parse(carData);
    container.innerHTML = `
      <div class='car-details'>
        <img
          class='car-image'
          src='data:image/jpeg;base64,${car.image}'
          alt='${car.name}'
        />
        <div class='car-info'>
          <h2 class='car-title'>${car.name} ${car.model}</h2>
          <p class='car-price'>SEK ${car.price} / day</p>
          <div class='car-features'>
            <p class='feature'>${car.feature1}</p>
            <p class='feature'>${car.feature2}</p>
            <p class='feature'>${car.feature3}</p>
          </div>
        </div>
      </div>

      <form id="booking-form">
      <div class="date-picker">
         <div class="form-group">
          <label for="fromDate">From Date</label>
          <input type="date" id="fromDate" name="fromDate" required />
        </div>
        
        <div class="form-group">
          <label for="toDate">To Date</label>
          <input type="date" id="toDate" name="toDate" required />
        </div>

      </div>
      <div class="price-summary">
        <div class="price-row">
          <span>Daily Rate:</span>
          <span id="daily-rate">SEK ${car.price}</span>
        </div>
        <div class="price-row">
          <span>Number of Days:</span>
          <span id="num-days">1</span>
        </div>
        <div class="price-row price-total">
          <span>Total Price:</span>
          <span id="total-price">SEK ${car.price}</span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-book"
        id="book-button"
        onclick="handleBooking()"
      >
        Book these dates
      </button>
      </form>
    `;

    setupDateListeners(car.price);
  } else {
    container.innerHTML = "<p>No car selected. Please select a car first.</p>";
    console.log("No car data found in localStorage");
  }
}

function setupDateListeners(price) {
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");

  // Set minimum from date to today
  const today = new Date().toISOString().split("T")[0];
  fromDateInput.min = today;

  // Set event listeners for both date inputs
  fromDateInput.addEventListener("change", () => {
    // When from date changes, set minimum to-date to be the from date
    toDateInput.min = fromDateInput.value;
    updatePriceSummary(price);
  });

  toDateInput.addEventListener("change", () => {
    updatePriceSummary(price);
  });
}

function updatePriceSummary(price) {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  if (fromDate && toDate) {
    const { days, total } = calcDaysAndPrice(fromDate, toDate, price);

    document.getElementById("num-days").textContent = days;
    document.getElementById("total-price").textContent = `SEK ${total}`;
  }
}

function calcDaysAndPrice(from, to, price) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  let days = 0;
  if (fromDate && toDate && toDate > fromDate) {
    days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
  }
  days = Math.max(days, 1);
  return {
    days,
    total: days * price,
  };
}

/**
 * Handles the booking process by sending booking data to the API
 */
async function handleBooking() {
  try {
    // Show loading state
    const bookButton = document.getElementById("book-button");
    bookButton.disabled = true;
    bookButton.textContent = "Processing...";

    // Get car data from localStorage
    const carData = localStorage.getItem("selectedCar");
    if (!carData) {
      throw new Error("No car selected. Please select a car first.");
    }

    const car = JSON.parse(carData);
    const carId = car.id;

    // Get dates from form inputs
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    // Validate dates
    if (!fromDate || !toDate) {
      throw new Error("Please select both start and end dates.");
    }

    // Create the booking data object
    const bookingData = {
      carId: parseInt(carId),
      fromDate: fromDate,
      toDate: toDate,
      active: true,
    };

    const token = sessionStorage.getItem("token");

    // Make the booking request
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Booking failed with status: ${response.status}`
      );
    }

    // Parse the response data
    //     let bookingResponse = null;
    // const responseText = await response.text();
    // if (responseText) {
    //   bookingResponse = JSON.parse(responseText);
    // }

    // Show success message
    const container = document.getElementById("selected-car-container");
    container.innerHTML = `
      <div class="booking-success">
        <h2>Booking Successful!</h2>
        <p>Your booking for the ${car.name} ${car.model} has been confirmed.</p>
        <p>Pickup date: ${formatDate(fromDate)}</p>
        <p>Return date: ${formatDate(toDate)}</p>
        <p>Total price: SEK ${
          calcDaysAndPrice(fromDate, toDate, car.price).total
        }</p>
        <button class="btn btn-primary" onclick="navigateTo('my-bookings')">View My Bookings</button>
        <button class="btn btn-secondary" onclick="navigateTo('car-list')">Book Another Car</button>
      </div>
    `;

    // Clear the selected car from sessionStorage when booking is complete.
    localStorage.removeItem("selectedCar");
  } catch (error) {
    console.error("Booking error:", error);

    // Show error message
    const errorElement = document.createElement("div");
    errorElement.className = "booking-error";
    errorElement.textContent = `Failed to create booking: ${error.message}`;

    const container = document.getElementById("selected-car-container");
    container.prepend(errorElement);

    // Reset button state
    const bookButton = document.getElementById("book-button");
    if (bookButton) {
      bookButton.disabled = false;
      bookButton.textContent = "Book these dates";
    }

    // Auto-remove error message after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);
  }
}

// Helper function to format dates nicely
function formatDate(dateStr) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

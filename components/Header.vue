<!-- Internal company Header component -->

<template>
  <header id="main-header" class="bg-white">
    <div class="container header-container">
      <a
        class="join-us-btn btn-small"
        target="_blank"
        href="https://www.airgradient.com/open-air-max"
      >
        >>> NEW: Open Air Max with NO2 and O3
      </a>
      <nav class="navbar navbar-expand-lg navbar-light">
        <a target="_blank" class="navbar-brand" href="https://www.airgradient.com">
          <img width="160" alt="AirGradient Logo" src="assets/images/logos/logo_blue.svg" />
        </a>
        <button
          class="navbar-toggler border-0"
          type="button"
          data-toggle="collapse"
          data-target="#navigation"
          aria-controls="navigation"
          aria-expanded="false"
          aria-label="Toggle navigation"
          @click="toggleNavbar()"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse text-center" :class="{ show: isNavbarVisible }">
          <ul class="navbar-nav ml-auto">
            <li v-for="(link, index) in HEADER_LINKS_CONFIG" :key="index" class="nav-item">
              <a class="nav-link" :target="link.openBlank ? '_blank' : ''" :href="link.path">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </header>
</template>
<script setup lang="ts">
  import { HEADER_LINKS_CONFIG } from '~/constants/shared/header-links-config';
  import { ref } from 'vue';

  const isNavbarVisible = ref(false);

  const toggleNavbar = () => {
    isNavbarVisible.value = !isNavbarVisible.value;
  };
</script>
<style>
  #map {
    height: calc(100vh - 129px) !important;
  }
</style>

<style lang="scss" scoped>
  .native-app.ios header {
    margin-top: 40px;
  }

  select {
    border: 1px solid var(--select-border);
    border-radius: 0.25em;
    padding: 0.25em 0.5em;
    cursor: pointer;
    line-height: 1.5;
    background-color: #fff;
    background-image: linear-gradient(to top, #f9f9f9, #fff 33%);
  }

  .active {
    background-color: #1c75bc;
    border-radius: 0px;
    height: 90px;
    color: #fff !important;
  }

  .active2 {
    background-color: #114b79;
    border-radius: 0px;
    height: 50px;
    color: #fff !important;
  }

  .navbar {
    padding: 0px !important;
    line-height: 100px;
  }

  .navbar2 {
    padding: 0px !important;
    line-height: 70px !important;
  }

  .join-us-btn {
    position: absolute;
    top: 0;
    right: 0;
    border: none !important;
    margin-top: 12px;
    margin-right: 17px;
    color: #1c75bc;
    z-index: 999;
    transition: all 200ms ease-in-out;
  }

  .join-us-btn:hover {
    background-color: #ffffff !important;
    color: #02579a !important;
  }

  .header-container {
    padding-top: 25px;
    padding-bottom: 10px;
    position: relative;
  }

  .navbar-toggler {
    color: #e8a325 !important;
    border-width: 1px !important;

    &:focus {
      box-shadow: 0 0 0 2px !important;
    }
  }

  @media (max-width: 991px) {
    .header-container {
      padding-top: 30px;
    }

    .logo-image {
      max-width: 125px;
    }
  }
</style>

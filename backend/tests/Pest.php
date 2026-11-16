<?php

use Tests\TestCase;

// RefreshDatabase stays off here: each test that touches the database opts in
// with `uses(RefreshDatabase::class)`.
pest()->extend(TestCase::class)->in('Feature');

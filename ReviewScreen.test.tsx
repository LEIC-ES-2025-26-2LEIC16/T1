import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
// Assuming your component is named ReviewScreen
import ReviewScreen from '../components/ReviewScreen'; 
// Assuming you have a file/service that handles API calls
import * as api from '../services/api'; 

// Mock the API call so we don't make real requests during tests
jest.mock('../services/api');

describe('User Story: Review Recycling Bins', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  // ======================================================
  // Scenario #1: Normal - Successfully submitting a review
  // ======================================================
  it('Scenario 2.1: Successfully submits a review and shows success message', async () => {
    // GIVEN: The API will respond successfully
    (api.submitReview as jest.Mock).mockResolvedValueOnce({ success: true });

    // GIVEN: I am viewing the details screen of the "Downtown Park" bin
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <ReviewScreen binName="Downtown Park" binId="123" />
    );

    // WHEN: I select a 5-star rating
    // (Assuming you gave testID="star-5" to the 5th star icon)
    const star5 = getByTestId('star-5');
    fireEvent.press(star5);

    // WHEN: I write a comment
    const commentInput = getByPlaceholderText('Comment (optional)');
    fireEvent.changeText(commentInput, 'Very clean and easy to access!');

    // WHEN: I click on "Submit Review"
    const submitButton = getByText('SUBMIT REVIEW');
    fireEvent.press(submitButton);

    // THEN: The system should save the review (call the API with the right data)
    expect(api.submitReview).toHaveBeenCalledWith('123', 5, 'Very clean and easy to access!');

    // THEN: It should display a success message
    await waitFor(() => {
      expect(getByText('Thank you for your feedback!')).toBeTruthy();
    });
  });
});
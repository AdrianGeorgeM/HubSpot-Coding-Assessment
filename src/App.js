import React, { useState, useEffect } from 'react';

// API endpoints
const API_GET_URL =
	'https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=28097c5a0ffcbfd79be06446f989';
const API_POST_URL =
	'https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=28097c5a0ffcbfd79be06446f989';

function HubSpotEventPlanner() {
	const [result, setResult] = useState(null);

	// Effect to initiate data processing on component mount
	useEffect(() => {
		fetchDataAndProcess();
	}, []);

	// Fetches data from the API, processes it, and submits the result
	const fetchDataAndProcess = async () => {
		try {
			const response = await fetch(API_GET_URL);
			const data = await response.json();

			const bestDates = processPartnerData(data);
			const submissionResponse = await submitData(bestDates);

			setResult(submissionResponse);
		} catch (error) {
			console.error('Error:', error);
		}
	};

	// Processes partner data to find the best event start dates for each country
	function processPartnerData(data) {
		const availability = {};

		// Organizing partner availability by country and date
		data.partners.forEach((partner) => {
			if (!availability[partner.country]) {
				availability[partner.country] = {};
			}

			partner.availableDates.forEach((date) => {
				if (!availability[partner.country][date]) {
					availability[partner.country][date] = [];
				}
				availability[partner.country][date].push(partner.email);
			});
		});

		// Determining the best start dates
		const bestDates = { countries: [] };
		for (const country in availability) {
			let maxCount = 0;
			let bestStartDate = null;
			const dates = Object.keys(availability[country]);

			dates.forEach((date, index) => {
				const nextDate = new Date(date);
				nextDate.setDate(nextDate.getDate() + 1);
				const nextDateString = nextDate.toISOString().split('T')[0];

				// Checking for consecutive dates with the most attendees
				if (dates.includes(nextDateString)) {
					const attendees = availability[country][date].filter((email) =>
						availability[country][nextDateString].includes(email)
					);

					if (attendees.length > maxCount) {
						maxCount = attendees.length;
						bestStartDate = date;
					}
				}
			});

			bestDates.countries.push({
				name: country,
				startDate: bestStartDate,
				attendeeCount: maxCount,
				attendees: bestStartDate
					? availability[country][bestStartDate].filter((email) =>
							availability[country][
								new Date(bestStartDate).toISOString().split('T')[0]
							].includes(email)
					  )
					: [],
			});
		}

		return bestDates;
	}

	// Submits the processed data to the API
	async function submitData(bestDates) {
		try {
			const response = await fetch(API_POST_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bestDates),
			});
			return await response.json();
		} catch (error) {
			console.error('Error submitting data:', error);
			return null;
		}
	}

	// Rendering the component with the submission result
	return (
		<div>
			<h1>HubSpot Event Planner</h1>
			{result && (
				<div>
					<h2>Submission Result</h2>
					<pre>{JSON.stringify(result, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}

export default HubSpotEventPlanner;

import { useEffect, useState } from "react";

const countriesNames = [];

function App() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    fetch(
      "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=7814f7b415916e4f550a09a4c9bc"
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.log(response);
        }
      })
      .then((data) => {
        setPartners(data.partners);
        getCountries();
      });
  }, []);

  const getCountries = () => {
    partners.forEach((partner) => {
      if (!countriesNames.includes(partner.country)) {
        countriesNames.push(partner.country);
      }
    });

    getDates();
  };

  const getDates = () => {
    const partnersInCountry = countriesNames.map((country) => {
      return partners.filter((partner) => partner.country === country);
    });

    const countryDates = partnersInCountry.map((partnerInCountry) => {
      const partnerDates = partnerInCountry.map(
        (partner) => partner.availableDates
      );

      const consecutiveDays = partnerDates.map((date) => {
        return date.map((day) => {
          return date.map((testDate) => {
            if (
              new Date(testDate).getTime() - 86400000 ===
              new Date(day).getTime()
              ) {
              return day;
            } else if (
              new Date(testDate).getTime() + 86400000 ===
              new Date(day).getTime()
            ) {
              return testDate;
            } else {
              return null;
            }
          });
        });
      });

      return consecutiveDays;
    });

    const cleanedDates = countryDates.map((dates) => {
      return dates.map((dateArr) => {
        return dateArr.filter((dateArr2) => {
          if (dateArr2.length) {
            return dateArr2[0];
          }
        });
      });
    });

    const countryMeetingDates = cleanedDates.map((peopleDates) => {
      const simpleDates = peopleDates.map((arr) => arr.map((arr2) => arr2[0]));
      const dateArray = [];
      simpleDates.forEach((dateArr) => {
        dateArr.forEach((date) => dateArray.push(date));
      });

      function getDates(arr) {
        return arr
          .sort(
            (a, b) =>
              arr.filter((v) => v === a).length -
              arr.filter((v) => v === b).length
          )
          .pop();
      }

      return getDates(dateArray);
    });

    const countries = countryMeetingDates.reduce((acc, countryDate, index) => {
      const attendees = partners.filter((partner) => {
        if (partner.availableDates.includes(countryDate)) {
          return partner.email;
        }
      });

      acc.push({
        attendeeCount: attendees.length,
        attendees: attendees.map((attendee) => attendee.email),
        name: countriesNames[index],
        startDate: countryDate ? countryDate : null,
      });
      return acc;
    }, []);

    sendInvites(countries);
  };

  const sendInvites = (data) => {
    console.log(data)
    fetch(
      "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=7814f7b415916e4f550a09a4c9bc",
      {
        method: "POST",
        body: JSON.stringify({ "countries": data }),
        headers: {
          "Content-type": "application/json",
        },
      }
    ).then((response) => console.log(response))
  };

  return <div className="App"></div>;
}

export default App;

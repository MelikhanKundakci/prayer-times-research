use chrono::{Duration, NaiveDate, SecondsFormat};
use mawaqit::prelude::*;
use serde_json::json;

#[derive(Clone, Copy)]
struct City { name: &'static str, latitude: f64, longitude: f64 }

const CITIES: [City; 6] = [
    City { name: "frankfurt", latitude: 50.1109, longitude: 8.6821 },
    City { name: "berlin", latitude: 52.52, longitude: 13.405 },
    City { name: "edinburgh", latitude: 55.9533, longitude: -3.1883 },
    City { name: "oslo", latitude: 59.9139, longitude: 10.7522 },
    City { name: "ushuaia", latitude: -54.8019, longitude: -68.303 },
    City { name: "tromso", latitude: 69.6492, longitude: 18.9553 },
];

fn iso(time: chrono::DateTime<chrono::Utc>) -> String {
    time.to_rfc3339_opts(SecondsFormat::Secs, true)
}

fn main() {
    let year: i32 = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "2027".to_string())
        .parse()
        .expect("year must be an integer");
    let days_in_year = if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 366 } else { 365 };
    let parameters = Configuration::with(Method::MuslimWorldLeague, Madhab::Shafi);
    let mut parameters = parameters;
    parameters.high_latitude_rule = HighLatitudeRule::LocalRelativeEstimation;
    parameters.polar_estimation = None;
    parameters.rounding = Rounding::None;
    assert_eq!(parameters.fajr_angle, 18.0);
    assert_eq!(parameters.isha_angle, 17.0);
    assert_eq!(parameters.rounding, Rounding::None);

    for city in CITIES {
        let coordinates = Coordinates::new(city.latitude, city.longitude);
        let start = NaiveDate::from_ymd_opt(year, 1, 1).unwrap();
        for day_offset in 0..days_in_year {
            let date = start + Duration::days(day_offset);
            let calculated = PrayerSchedule::new()
                .on(date)
                .for_location(coordinates)
                .with_configuration(parameters)
                .calculate();
            match calculated {
                Ok(times) => println!("{}", json!({
                    "city": city.name,
                    "date": date.to_string(),
                    "events": {
                        "fajr": iso(times.time(Prayer::Fajr)),
                        "sunrise": iso(times.time(Prayer::Sunrise)),
                        "dhuhr": iso(times.time(Prayer::Dhuhr)),
                        "asr": iso(times.time(Prayer::Asr)),
                        "maghrib": iso(times.time(Prayer::Maghrib)),
                        "isha": iso(times.time(Prayer::Isha))
                    },
                    "error": null,
                    "statuses": null,
                    "metadata": {
                        "library": "mawaqit",
                        "library_version": "0.4.0",
                        "library_commit": "50f18017317a6858058fb8734a68fd415073f5e7",
                        "method": "MuslimWorldLeague",
                        "fajr_angle_deg": 18.0,
                        "isha_angle_deg": 17.0,
                        "madhab": "Shafi_factor_1",
                        "high_latitude_rule": "LocalRelativeEstimation",
                        "polar_estimation": null,
                        "rounding": "None"
                    }
                })),
                Err(error) => println!("{}", json!({
                    "city": city.name,
                    "date": date.to_string(),
                    "events": { "fajr": null, "sunrise": null, "dhuhr": null, "asr": null, "maghrib": null, "isha": null },
                    "error": error,
                    "statuses": null,
                    "metadata": {
                        "library": "mawaqit",
                        "library_version": "0.4.0",
                        "library_commit": "50f18017317a6858058fb8734a68fd415073f5e7",
                        "method": "MuslimWorldLeague",
                        "fajr_angle_deg": 18.0,
                        "isha_angle_deg": 17.0,
                        "madhab": "Shafi_factor_1",
                        "high_latitude_rule": "LocalRelativeEstimation",
                        "polar_estimation": null,
                        "rounding": "None"
                    }
                })),
            }
        }
    }
}

use chrono::{Duration, NaiveDate, SecondsFormat};
use mawaqit::prelude::*;
use serde_json::json;

#[derive(Clone, Copy)]
struct City {
    name: &'static str,
    latitude: f64,
    longitude: f64,
}

const CITIES: [City; 6] = [
    City { name: "Frankfurt", latitude: 50.1109, longitude: 8.6821 },
    City { name: "Berlin", latitude: 52.52, longitude: 13.405 },
    City { name: "Edinburgh", latitude: 55.9533, longitude: -3.1883 },
    City { name: "Oslo", latitude: 59.9139, longitude: 10.7522 },
    City { name: "Ushuaia", latitude: -54.8019, longitude: -68.303 },
    City { name: "Tromso", latitude: 69.6492, longitude: 18.9553 },
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
    let days_in_year = if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) {
        366
    } else {
        365
    };
    let parameters = Configuration::from_method(Method::MuslimWorldLeague)
        .madhab(Madhab::Shafi)
        .high_latitude_rule(HighLatitudeRule::LocalRelativeEstimation)
        .rounding(Rounding::None)
        .build();

    assert_eq!(parameters.fajr_angle(), 18.0);
    assert_eq!(parameters.isha_angle(), 17.0);
    assert_eq!(parameters.madhab(), Madhab::Shafi);
    assert_eq!(parameters.polar_estimation(), None);
    assert_eq!(parameters.rounding(), Rounding::None);

    for city in CITIES {
        let coordinates = Coordinates::new(city.latitude, city.longitude);
        let start = NaiveDate::from_ymd_opt(year, 1, 1).unwrap();
        for day_offset in 0..days_in_year {
            let date = start + Duration::days(day_offset);
            match PrayerTimes::try_new(date, coordinates, parameters) {
                Ok(times) => println!(
                    "{}",
                    json!({
                        "city": city_id(city.name),
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
                        "statuses": {
                            "fajr": format!("{:?}", times.status(Prayer::Fajr)),
                            "isha": format!("{:?}", times.status(Prayer::Isha))
                        },
                        "metadata": metadata()
                    })
                ),
                Err(error) => println!(
                    "{}",
                    json!({
                        "city": city_id(city.name),
                        "date": date.to_string(),
                        "events": { "fajr": null, "sunrise": null, "dhuhr": null, "asr": null, "maghrib": null, "isha": null },
                        "error": error.to_string(),
                        "statuses": null,
                        "metadata": metadata()
                    })
                ),
            }
        }
    }
}

fn city_id(name: &str) -> &str {
    match name {
        "Frankfurt" => "frankfurt",
        "Berlin" => "berlin",
        "Edinburgh" => "edinburgh",
        "Oslo" => "oslo",
        "Ushuaia" => "ushuaia",
        "Tromso" => "tromso",
        _ => unreachable!(),
    }
}

fn metadata() -> serde_json::Value {
    json!({
        "library": "mawaqit",
        "library_version": "0.5.0",
        "library_commit": "aa31f98b0128e54c936b6e8e37841102ce90d454",
        "method": "MuslimWorldLeague",
        "fajr_angle_deg": 18.0,
        "isha_angle_deg": 17.0,
        "madhab": "Shafi_factor_1",
        "high_latitude_rule": "LocalRelativeEstimation",
        "polar_estimation": null,
        "rounding": "None"
    })
}

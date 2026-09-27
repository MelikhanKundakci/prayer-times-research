package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"time"

	prayer "github.com/hablullah/go-prayer"
)

type location struct {
	id        string
	latitude  float64
	longitude float64
	timezone  string
}

type record struct {
	City   string             `json:"city"`
	Date   string             `json:"date"`
	Events map[string]*string `json:"events"`
	Error  *string            `json:"error"`
}

func utc(t time.Time) *string {
	if t.IsZero() {
		return nil
	}
	value := t.UTC().Format(time.RFC3339)
	return &value
}

func emptyEvents() map[string]*string {
	return map[string]*string{
		"fajr": nil, "sunrise": nil, "dhuhr": nil,
		"asr": nil, "maghrib": nil, "isha": nil,
	}
}

func main() {
	locations := []location{
		{"frankfurt", 50.1109, 8.6821, "Europe/Berlin"},
		{"berlin", 52.52, 13.405, "Europe/Berlin"},
		{"edinburgh", 55.9533, -3.1883, "Europe/London"},
		{"oslo", 59.9139, 10.7522, "Europe/Oslo"},
		{"ushuaia", -54.8019, -68.303, "America/Argentina/Ushuaia"},
		{"tromso", 69.6492, 18.9553, "Europe/Oslo"},
	}

	writer := bufio.NewWriter(os.Stdout)
	defer writer.Flush()
	encoder := json.NewEncoder(writer)

	for _, year := range []int{2026, 2027, 2028} {
		for _, loc := range locations {
			zone, err := time.LoadLocation(loc.timezone)
			if err != nil {
				fatal(err)
			}
			schedules, err := prayer.Calculate(prayer.Config{
				Latitude:            loc.latitude,
				Longitude:           loc.longitude,
				Timezone:            zone,
				TwilightConvention:  prayer.MWL(),
				AsrConvention:       prayer.Shafii,
				HighLatitudeAdapter: prayer.LocalRelativeEstimation(),
				PreciseToSeconds:    true,
			}, year)

			if err != nil {
				message := err.Error()
				for date := time.Date(year, 1, 1, 0, 0, 0, 0, zone); date.Year() == year; date = date.AddDate(0, 0, 1) {
					if encodeErr := encoder.Encode(record{
						City: loc.id, Date: date.Format("2006-01-02"),
						Events: emptyEvents(), Error: &message,
					}); encodeErr != nil {
						fatal(encodeErr)
					}
				}
				continue
			}

			for _, schedule := range schedules {
				events := map[string]*string{
					"fajr": utc(schedule.Fajr), "sunrise": utc(schedule.Sunrise),
					"dhuhr": utc(schedule.Zuhr), "asr": utc(schedule.Asr),
					"maghrib": utc(schedule.Maghrib), "isha": utc(schedule.Isha),
				}
				if err := encoder.Encode(record{
					City: loc.id, Date: schedule.Date, Events: events, Error: nil,
				}); err != nil {
					fatal(err)
				}
			}
		}
	}
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
